#!/usr/bin/env python3
"""Claude Code / Codex 마켓플레이스로 설치한 플러그인을 Kiro Power로 이식한다.

    kiro-port.py scan                      # CC·Codex에 설치된 플러그인 목록
    kiro-port.py port <name>[@<market>]... # 변환 + ~/.kiro 에 설치·등록
    kiro-port.py port --all
    kiro-port.py unport <name>...          # 이식한 Power 제거
옵션: --dry-run  --out DIR(설치하지 않고 저장소만 생성)  --smoke(kiro-cli v3로 로드 확인)

원칙: 본문은 바이트 단위로 그대로. 바뀌는 것은 포장(plugin.json, 머리말 한 줄, 훅 스키마)과
위치만. 사람이 정해야 할 것(keywords 등)은 REPORT에 남긴다. 표준 밖 항목은 지우지 않고
dev.kiro/ 및 ~/.kiro/hooks, ~/.kiro/agents 로 옮긴다.
"""
import argparse
import json
import os
import re
import shlex
import shutil
import subprocess
import sys
import tomllib
from pathlib import Path

HOME = Path.home()
KIRO = Path(os.environ.get("KIRO_HOME", HOME / ".kiro"))
PLUGIN_SCHEMA = "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json"
MCP_SCHEMA = "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json"
HOOK_EVENTS = {"PreToolUse", "PostToolUse", "UserPromptSubmit", "Stop", "SessionStart"}
# 이벤트명은 그대로 옮긴다. kiro.dev/docs/hooks/ 는 PromptSubmit/AgentStop 이라 적지만, 실제 `kiro-cli
# --v3` 인터랙티브 세션에 두 이름을 나란히 걸어 직접 확인한 결과 발동하는 건 원래 이름
# (UserPromptSubmit/Stop) 쪽이었다 — 문서가 실제 CLI 동작과 다르다.
HOOK_TOOL_MAP = {"Bash": "execute_bash", "Read": "fs_read", "Write": "fs_write", "Edit": "fs_write"}
CMD_DROP_KEYS = {"allowed-tools", "argument-hint"}
# Kiro 는 스킬 트리의 모든 파일마다 fd 를 열고 닫지 않아(kirodotdev/Kiro#10625) 파일이 많으면
# 확장 호스트의 fd 가 고갈되고 `spawn EBADF` 로 셸이 죽는다. 실행에 불필요한 트리는 옮기지 않는다.
EXCLUDE = shutil.ignore_patterns(
    ".git", "node_modules", ".venv", "venv", "__pycache__", ".pytest_cache", ".mypy_cache",
    "dist", "build", ".next", ".turbo", "target", "*.log", "*.map", ".DS_Store")
FILE_WARN = 2000  # 이보다 파일이 많으면 경고
AGENT_DROP_KEYS = {"tools", "model", "mcpServers", "hooks", "permissionMode", "color", "effort",
                   "initialPrompt", "disallowedTools", "skills", "memory", "background", "isolation", "maxTurns"}
MANIFEST = Path(os.environ.get("KIRO_HOME", HOME / ".kiro")) / ".kiro-port-manifest.json"


def classify(src: Path) -> tuple[str, dict]:
    """플러그인을 skills(스킬만) / plugin(복합) / guidance(지침) 로 분류.

    Power 로 감쌀 필요가 있는지 판단하기 위한 것. 스킬만 있으면 Kiro 도 Agent Skills 표준을
    읽으므로 폴더 복사로 충분하고, Power 로 만들면 keywords 활성화 단계가 더 붙는다.
    """
    n = {
        "skills": len([d for d in (src / "skills").iterdir() if (d / "SKILL.md").exists()])
                  if (src / "skills").is_dir() else 0,
        "commands": len(list((src / "commands").iterdir())) if (src / "commands").is_dir() else 0,
        "agents": len(list((src / "agents").glob("*.md"))) if (src / "agents").is_dir() else 0,
        "hooks": 0,
        "mcp": 1 if (src / ".mcp.json").exists() else 0,
    }
    mf = next((p for p in (src / ".claude-plugin/plugin.json", src / "plugin.json") if p.exists()), None)
    m = json.loads(mf.read_text()) if mf else {}
    if (src / "hooks/hooks.json").exists() or isinstance(m.get("hooks"), str):
        n["hooks"] = 1
    # 훅과 에이전트는 어차피 Power 밖(~/.kiro/hooks, ~/.kiro/agents)에 설치되므로 Power 를 요구하지 않는다.
    # 검증: superpowers 를 Power 등록 해제하고 스킬만 전역에 둬도 SessionStart 훅이 그대로 발화한다.
    # Power 가 반드시 필요한 것은 mcp.json(Power 활성화 시 연결)과, 스킬로 바꿀 commands 다.
    if n["commands"] or n["mcp"]:
        return "plugin", n
    if n["skills"]:
        return "skills", n
    if n["hooks"] or n["agents"]:
        return "sidecar", n   # 스킬 없이 훅/에이전트만 — Power 껍데기만 필요
    return "guidance", n


def global_skill_count() -> int:
    d = KIRO / "skills"
    return len([x for x in d.iterdir() if (x / "SKILL.md").exists()]) if d.is_dir() else 0


def recommend(kind: str) -> str:
    """분류에 따라 설치 방식을 권한다. 스킬만 있으면 Power 로 감쌀 이유가 없다."""
    return {"plugin": "power", "guidance": "steering", "skills": "skills", "sidecar": "power"}[kind]


# ------------------------------------------------------------------ 설치 상태 읽기

def scan_sources() -> list[dict]:
    """CC와 Codex가 로컬에 설치해 둔 플러그인 디렉터리 목록."""
    out = []
    cc = HOME / ".claude/plugins/installed_plugins.json"
    if cc.exists():
        data = json.loads(cc.read_text())
        for key, installs in data.get("plugins", {}).items():
            name, _, market = key.partition("@")
            for inst in installs:
                p = Path(inst["installPath"])
                if p.is_dir():
                    out.append({"tool": "claude", "name": name, "market": market, "path": p,
                                "version": inst.get("version", ""), "scope": inst.get("scope", ""),
                                "project": inst.get("projectPath", "")})
    # Codex: config.toml 의 [marketplaces.*] + [plugins."name@market"] 가 설치 상태
    cfg_p = HOME / ".codex/config.toml"
    if cfg_p.exists():
        cfg = tomllib.loads(cfg_p.read_text())
        roots = {}
        for mk, m in cfg.get("marketplaces", {}).items():
            src = m.get("source", "")
            root = Path(src) if m.get("source_type") == "local" or src.startswith("/") else HOME / ".codex/.tmp/marketplaces" / mk
            roots[mk] = root
        for key, p in cfg.get("plugins", {}).items():
            name, _, mk = key.partition("@")
            root = roots.get(mk)
            if not root or not p.get("enabled", True):
                continue
            if mk.startswith("openai-"):  # ChatGPT/Codex 앱 내장 플러그인 — 런타임 종속, 이식 대상 아님
                continue
            # 설치본은 ~/.codex/plugins/cache/<market>/<name>/<version>/ (최신 것 하나)
            vers = sorted((HOME / ".codex/plugins/cache" / mk / name).glob("*/"), key=os.path.getmtime)
            if vers:
                cands = [{"name": name, "path": vers[-1], "version": vers[-1].name}]
            else:  # 캐시가 없으면 마켓플레이스 스냅샷의 로컬 소스
                cands = [c for c in marketplace_plugins(root) if c["name"] == name]
            for cand in cands:
                out.append({"tool": "codex", "name": name, "market": mk, "path": cand["path"],
                            "version": cand.get("version", ""), "scope": "user", "project": ""})
    return out


def marketplace_plugins(root: Path, fetch: bool = False, only: set | None = None) -> list[dict]:
    """마켓플레이스 저장소(.claude-plugin/marketplace.json) 안의 플러그인 목록.
    항목 `source` 가 문자열이면 저장소 안의 경로, dict 면 다른 git 저장소를 가리킨다
    (`url` / `git-subdir` / `github`). fetch=True 면 그 저장소도 받아온다.
    marketplace.json 이 없고 저장소 자체가 플러그인이면 그 하나."""
    mj = root / ".claude-plugin/marketplace.json"
    items = []
    if mj.exists():
        for e in json.loads(mj.read_text()).get("plugins", []):
            src, p = e.get("source"), None
            if isinstance(src, str):
                p = (root / src).resolve()
                p = p if p.is_dir() else None
            elif isinstance(src, dict):
                if not fetch or (only is not None and e["name"] not in only):
                    # 원격 저장소는 지목된 것만 받아온다 (대형 마켓플레이스는 항목이 수천 개)
                    items.append({"name": e["name"], "path": None, "version": str(e.get("version", "")),
                                  "description": e.get("description", ""), "remote": src})
                    continue
                repo = src.get("url") or src.get("repo") or ""
                if repo:
                    try:
                        p = fetch_source(repo, ref=src.get("ref")) / (src.get("path") or "")
                    except subprocess.CalledProcessError:
                        p = None
                    p = p if p and p.is_dir() else None
            if p:
                items.append({"name": e["name"], "path": p, "version": str(e.get("version", "")),
                              "description": e.get("description", "")})
    elif (root / ".claude-plugin/plugin.json").exists() or (root / "plugin.json").exists():
        m = json.loads(next(p for p in (root / ".claude-plugin/plugin.json", root / "plugin.json") if p.exists()).read_text())
        items.append({"name": m.get("name", root.name), "path": root, "version": str(m.get("version", "")),
                      "description": m.get("description", "")})
    return items


def fetch_source(src: str, ref: str | None = None) -> Path:
    """로컬 경로 | owner/repo | git URL → 로컬 디렉터리 (git 은 얕게 클론, 캐시 재사용)."""
    p = Path(src).expanduser()
    if p.is_dir():
        return p.resolve()
    url = src if "://" in src or src.startswith("git@") else f"https://github.com/{src}.git"
    dst = HOME / ".cache/kiro-port" / re.sub(r"[^\w.-]", "_", f"{src}@{ref}" if ref else src)
    if dst.is_dir():
        return dst
    cmd = ["git", "clone", "-q", "--depth", "1"] + (["--branch", ref] if ref else []) + [url, str(dst)]
    subprocess.run(cmd, check=True, capture_output=True)
    return dst


# ------------------------------------------------------------------ frontmatter (YAML 부분집합)

def split_frontmatter(text: str):
    """(머리말 줄 목록, 본문) — 본문은 바이트 그대로 보존하기 위해 문자열로 반환."""
    if not text.startswith("---"):
        return [], text
    end = text.find("\n---", 3)
    if end < 0:
        return [], text
    fm = text[4:end].split("\n")
    body = text[end + 4:]
    return fm, body


def fm_blocks(lines: list[str]) -> list[tuple[str, list[str]]]:
    """머리말을 (키, 원문 줄들) 블록으로. 들여쓴 연속 줄은 앞 키에 붙인다."""
    blocks, cur = [], None
    for ln in lines:
        m = re.match(r"^([\w-]+)\s*:", ln)
        if m:
            cur = (m.group(1), [ln])
            blocks.append(cur)
        elif cur:
            cur[1].append(ln)
    return blocks


def rebuild_fm(blocks: list[tuple[str, list[str]]], body: str) -> str:
    lines = [ln for _, ls in blocks for ln in ls]
    return "---\n" + "\n".join(lines) + "\n---" + body


# ------------------------------------------------------------------ 변환

class Port:
    def __init__(self, src: Path, power_dir: Path, report: list[str]):
        self.src, self.dst, self.report = src, power_dir, report
        self.root_token = "${CLAUDE_PLUGIN_ROOT}"

    def sub_root(self, s: str) -> str:
        # 허용되는 유일한 본문 수정: 설치 위치가 확정되므로 절대경로로 치환
        return s.replace(self.root_token, str(self.dst))

    def manifest(self) -> dict:
        for p in (self.src / ".claude-plugin/plugin.json", self.src / ".codex-plugin/plugin.json",
                  self.src / "plugin.json"):
            if p.exists():
                return json.loads(p.read_text())
        return {}

    def run(self, name: str, version_hint: str) -> None:
        m = self.manifest()
        if m.get("name") and m["name"] != name:
            # 매니페스트 name 과 등록 이름(디렉터리)이 다르면 Kiro 가 Power 목록 전체를 조용히 버린다.
            # 등록 이름을 진실로 삼고 원래 값을 보고서에 남긴다.
            self.report.append(f"- ⚠️ 원본 매니페스트 `name`은 `{m['name']}` 이지만 Power 이름은 `{name}` 로 맞춤 "
                               f"(마켓플레이스 항목 이름과 매니페스트가 다른 경우. Kiro 는 이름 중복·불일치 시 로드하지 않음)")
        # 1) 원본 복사 (CC 포맷 그대로 보존 → 같은 디렉터리를 CC도 계속 읽을 수 있음).
        #    node_modules 등은 제외한다 — fd 누출로 Kiro 확장 호스트를 죽인다(#10625).
        #    심볼릭 링크는 내용을 그대로 복사한다(symlinks=False) — 마켓플레이스 내부에서
        #    플러그인 밖을 가리키는 상대 심볼릭 링크(예: ../../../.claude/commands/x.md)가
        #    옮겨진 위치에서는 깨지기 때문.
        shutil.copytree(self.src, self.dst, symlinks=False, ignore=EXCLUDE)
        skipped = [p.name for p in self.src.iterdir()
                   if p.is_dir() and p.name in ("node_modules", ".venv", "venv", "dist", "build", "target")]
        if skipped:
            self.report.append(f"- 복사 제외: {skipped} (런타임 의존성/빌드 산출물. 필요하면 원본에서 다시 설치)")
        nfiles = sum(1 for p in self.dst.rglob("*") if p.is_file())
        if nfiles > FILE_WARN:
            self.report.append(f"- ⚠️ 파일 {nfiles}개. Kiro 는 스킬 트리의 모든 파일마다 fd 를 열어두므로"
                               f"(kirodotdev/Kiro#10625) 이 정도면 `spawn EBADF` 로 셸이 멈출 수 있다")
        skills = self.dst / "skills"
        skill_names = [d.name for d in skills.iterdir() if (d / "SKILL.md").exists()] if skills.is_dir() else []
        # 2) skills/ 본문의 ${CLAUDE_PLUGIN_ROOT}만 치환
        for f in skills.rglob("*") if skills.is_dir() else []:
            if f.is_file() and f.suffix in (".md", ".sh", ".py", ".json", ".yaml", ".yml"):
                t = f.read_text(errors="replace")
                if self.root_token in t:
                    f.write_text(self.sub_root(t))
                    self.report.append(f"- `{f.relative_to(self.dst)}`: `${{CLAUDE_PLUGIN_ROOT}}` → 설치 경로로 치환")
        # 3) commands/*.md → skills/<name>/SKILL.md
        cmd_dir = self.dst / "commands"
        for cmd in sorted(cmd_dir.glob("*.md")) if cmd_dir.is_dir() else []:
            self.command_to_skill(cmd, skill_names)
        others = [p.name for p in cmd_dir.iterdir() if p.is_file() and p.suffix != ".md"] if cmd_dir.is_dir() else []
        if others:
            self.report.append(f"- ❌ `.md` 아닌 command 는 변환하지 않음: {others}")
        # 4) plugin.json (루트)
        pj = {"$schema": PLUGIN_SCHEMA, "name": name,
              "version": str(m.get("version") or version_hint or "1.0.0"),
              "description": m.get("description", "")}
        for k in ("author", "license", "homepage", "repository"):
            if k in m:
                pj[k] = m[k]
        pj["keywords"] = sorted(set([pj["name"]] + skill_names))
        (self.dst / "plugin.json").write_text(json.dumps(pj, ensure_ascii=False, indent=2) + "\n")
        self.report.append(f"- `plugin.json` 생성. `keywords`는 플러그인·스킬 **이름에서만** 추출: "
                           f"{pj['keywords']} — 활성화 트리거이므로 필요하면 직접 수정")
        if not m.get("version"):
            self.report.append("- 원본에 `version` 없음 → `1.0.0`")
        # 5) .mcp.json → mcp.json
        mcp_src = self.dst / ".mcp.json"
        if mcp_src.exists():
            raw = json.loads(self.sub_root(mcp_src.read_text()))
            servers = raw.get("mcpServers", raw)
            (self.dst / "mcp.json").write_text(json.dumps(
                {"$schema": MCP_SCHEMA, "mcpServers": servers}, ensure_ascii=False, indent=2) + "\n")
            self.report.append(f"- `mcp.json` 생성 (서버 정의 무수정): {list(servers)}")
            # 검증(kiro-cli 2.21.0): Power 의 mcp.json 에서 stdio 서버는 정상 등록되지만
            # 원격 http/sse 서버는 조용히 무시된다(오류도 없음).
            remote = [n for n, s in servers.items()
                      if isinstance(s, dict) and s.get("type") in ("http", "sse", "streamable-http")]
            if remote:
                self.report.append(
                    f"- ❌ 원격 MCP 서버 {remote} 는 Power 에서 로드되지 않습니다 (오류도 표시되지 않음). "
                    f"쓰려면 정의를 `~/.kiro/settings/mcp.json` 에 직접 옮기세요. stdio 서버는 정상 동작합니다")
        # 6) hooks → dev.kiro/hooks/<name>.json
        hooks_file = self.dst / "hooks/hooks.json"
        if not hooks_file.exists() and isinstance(m.get("hooks"), str):
            hooks_file = self.dst / m["hooks"]
        if hooks_file.exists():
            self.convert_hooks(hooks_file, pj["name"])
        # 7) agents → dev.kiro/agents/<name>.md
        for ag in sorted((self.dst / "agents").glob("*.md")) if (self.dst / "agents").is_dir() else []:
            self.convert_agent(ag)

    def command_to_skill(self, cmd: Path, skill_names: list[str]) -> None:
        sname = cmd.stem
        target = self.dst / "skills" / sname / "SKILL.md"
        if sname in skill_names:
            self.report.append(f"- ⚠️ command `{sname}` 은 같은 이름의 skill 이 있어 건너뜀")
            return
        text = cmd.read_text(errors="replace")
        fm, body = split_frontmatter(text)
        blocks = fm_blocks(fm)
        kept = [(k, ls) for k, ls in blocks if k not in CMD_DROP_KEYS]
        dropped = [k for k, _ in blocks if k in CMD_DROP_KEYS]
        if not any(k == "name" for k, _ in kept):
            kept.insert(0, ("name", [f"name: {sname}"]))
        if not any(k == "description" for k, _ in kept):
            kept.append(("description", [f"description: {sname}"]))
            self.report.append(f"- command `{sname}`: `description` 없어 이름으로 채움 — 확인 필요")
        target.parent.mkdir(parents=True)
        target.write_text(rebuild_fm(kept, self.sub_root(body)))
        assert split_frontmatter(target.read_text())[1] == self.sub_root(body), "본문 불일치"
        note = f" (머리말에서 제거: {', '.join(dropped)})" if dropped else ""
        self.report.append(f"- command `{sname}.md` → `skills/{sname}/SKILL.md`, 본문 동일{note}")
        skill_names.append(sname)

    def convert_hooks(self, hooks_file: Path, pname: str) -> None:
        """Claude Code hooks.json → Kiro v1 스키마.

        Kiro 가 모르는 필드(`if`, `asyncRewake`, `timeout` 등)는 버리지 않고 보고서에 남긴다.
        특히 `if` 는 같은 command 를 조건별로 여러 번 등록하는 데 쓰이므로, 이걸 잃으면
        결과물이 '같은 훅의 중복'처럼 보이고 조건 분기가 조용히 사라진다.
        """
        raw = json.loads(hooks_file.read_text())
        raw_hooks = raw.get("hooks", {})
        if isinstance(raw_hooks, list):
            # 일부 플러그인은 {event,command,...} 평면 리스트로 쓴다(중첩 matcher/hooks 배열이 아님).
            # 이하 로직이 기대하는 {event: [{matcher, hooks:[{type,command,...}]}]} 형태로 맞춘다.
            grouped: dict = {}
            for item in raw_hooks:
                ev = item["event"]
                h = {k: v for k, v in item.items() if k != "event"}
                h.setdefault("type", "command")
                grouped.setdefault(ev, []).append({"hooks": [h]})
            raw_hooks = grouped
        out, skipped, dropped = [], [], []
        for event, entries in raw_hooks.items():
            if event not in HOOK_EVENTS:
                skipped.append(event)
                continue
            for i, entry in enumerate(entries):
                matcher = entry.get("matcher")
                if matcher:
                    parts = [HOOK_TOOL_MAP.get(p, p) for p in re.split(r"\|", matcher)]
                    matcher = "|".join(dict.fromkeys(parts))
                for j, h in enumerate(entry.get("hooks", [])):
                    if h.get("type", "command") != "command":
                        skipped.append(f"{event}[{i}].hooks[{j}] type={h.get('type')}")
                        continue
                    cmd = f'CLAUDE_PLUGIN_ROOT="{self.dst}" ' + self.sub_root(h["command"])
                    # `shell` 은 이 명령을 어떤 셸로 돌리라는 지시다. Kiro 훅에는 대응 필드가 없으므로
                    # 명령 자체를 그 셸로 감싼다. 버리면 `.cmd` 같은 파일이 직접 실행돼 실패한다.
                    sh = h.get("shell")
                    if sh:
                        cmd = f"{sh} -c {shlex.quote(cmd)}"
                    # Kiro 에 대응 필드가 없는 것들. 이름에 실어 구분을 남기고 보고서에 적는다.
                    extra = {k: v for k, v in h.items() if k not in ("type", "command", "shell")}
                    label = re.sub(r"[^\w.-]+", "-", str(extra.get("if", ""))).strip("-").lower()
                    name = f"{pname}-{event.lower()}-{i}-{j}" + (f"-{label}" if label else "")
                    hook = {"name": name[:80], "trigger": event,
                            "action": {"type": "command", "command": cmd}}
                    if matcher:
                        hook["matcher"] = matcher
                    out.append(hook)
                    if extra:
                        dropped.append((name[:80], extra))
        if out:
            d = self.dst / "dev.kiro/hooks"
            d.mkdir(parents=True, exist_ok=True)
            (d / f"{pname}.json").write_text(json.dumps({"version": "v1", "hooks": out}, ensure_ascii=False, indent=2) + "\n")
            self.report.append(f"- hooks {len(out)}개 → `dev.kiro/hooks/{pname}.json` (설치 시 `~/.kiro/hooks/`로 복사)")
            self.report.append(
                "  ⚠️ `kiro-cli --v3`의 인터랙티브 세션에서만 발동한다(직접 확인). 클래식 모드(`kiro-cli`, "
                "`--v3` 없이)나 `--no-interactive` 헤드리스 세션에서는 훅이 로드되지 않아 `/hooks`가 0으로 "
                "표시된다."
            )
        # if 를 잃은 훅들이 같은 trigger+matcher 를 공유하면, 서로 다른 조건에서 한 번씩 돌던 것이
        # 조건 없이 전부 같은 자리에 겹쳐 매 호출마다 그 개수만큼 반복 실행된다. 이 배수를 알려준다.
        if_dropped = [h for h in out if any(n == h["name"] for n, e in dropped if "if" in e)]
        overlap = {}
        for h in if_dropped:
            key = (h["trigger"], h.get("matcher"), h["action"]["command"])
            overlap.setdefault(key, []).append(h["name"])
        for name, extra in dropped:
            keys = ", ".join(f"`{k}`" for k in extra)
            self.report.append(f"- ❌ `{name}`: Kiro 에 대응 없는 필드를 옮기지 못했습니다 — {keys}")
            if "if" in extra:
                n_same = next((len(v) for v in overlap.values() if name in v), 1)
                self.report.append(f"    원본은 `{extra['if']}` 일 때만 실행됩니다. Kiro 훅에는 조건 필드가 없어 "
                                   f"**매처에 걸리는 모든 호출에서 실행**됩니다" +
                                   (f" — 같은 명령이 이 자리에 {n_same}개 겹쳐 있어, 호출 한 번에 {n_same}번 돕니다"
                                    if n_same > 1 else ""))
        if skipped:
            self.report.append(f"- ❌ 대응 없는 훅은 변환하지 않음: {skipped}")

    def convert_agent(self, ag: Path) -> None:
        fm, body = split_frontmatter(ag.read_text(errors="replace"))
        blocks = fm_blocks(fm)
        kept = [(k, ls) for k, ls in blocks if k not in AGENT_DROP_KEYS]
        dropped = [k for k, _ in blocks if k in AGENT_DROP_KEYS]
        d = self.dst / "dev.kiro/agents"
        d.mkdir(parents=True, exist_ok=True)
        (d / ag.name).write_text(rebuild_fm(kept, self.sub_root(body)))
        note = f" (머리말 제거: {', '.join(dropped)} — Kiro md 에이전트에 대응 없음)" if dropped else ""
        self.report.append(f"- agent `{ag.name}` → `dev.kiro/agents/` 본문 동일{note}. 설치 시 `~/.kiro/agents/`로 복사")


# ------------------------------------------------------------------ Kiro 설치·등록

def _load(p: Path, default):
    return json.loads(p.read_text()) if p.exists() else default


def _save(p: Path, data) -> None:
    if p.exists():
        shutil.copy(p, p.with_suffix(p.suffix + ".bak"))
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")


def _manifest_put(name: str, entry: dict) -> None:
    m = _load(MANIFEST, {})
    m[name] = entry
    _save(MANIFEST, m)


def install_skills_only(power_dir: Path, report: list[str], name: str) -> None:
    """스킬은 ~/.kiro/skills/ 에, 훅·에이전트는 Power 밖 제자리에 둔다.

    Power 로 감싸지 않으므로 스킬이 슬래시(`/스킬이름`)로 호출된다. 훅은 ~/.kiro/hooks/ 에
    설치되면 Power 등록과 무관하게 발화하므로 함께 살린다(검증: superpowers).
    """
    dst_root = KIRO / "skills"
    dst_root.mkdir(parents=True, exist_ok=True)
    placed = []
    skill_dirs = sorted((power_dir / "skills").iterdir())
    for sk in skill_dirs:
        if not (sk / "SKILL.md").exists():
            continue
        dst = dst_root / sk.name
        if dst.exists():
            report.append(f"- ⚠️ `{dst}` 이미 있어 건너뜀 (같은 이름의 스킬)")
            continue
        shutil.copytree(sk, dst)
        placed.append(sk.name)
    report.append(f"- 스킬 {len(placed)}개 → `{dst_root}` : {placed}")
    # 스킬이 아닌 형제 폴더(SKILL.md 없음)를 한 스킬이 상대경로(../폴더명/)나
    # ${CLAUDE_PLUGIN_ROOT}/skills/폴더명 으로 참조하면, 그 폴더도 같이 옮겨야 링크가 안 깨진다.
    # 평평한 skills/ 구조라 상대경로는 그대로 살아있다 — 폴더 자체만 옮기면 된다.
    shared_dirs = [d for d in skill_dirs if d.is_dir() and not (d / "SKILL.md").exists()]
    shared_copied = []
    for shared in shared_dirs:
        referenced = any(
            shared.name in (dst_root / p / "SKILL.md").read_text(errors="ignore")
            for p in placed
        )
        if not referenced:
            continue
        dst = dst_root / shared.name
        if dst.exists():
            report.append(f"- ⚠️ `{dst}` 이미 있어 공유 폴더를 건너뜀 (참조하는 스킬이 깨질 수 있음)")
            continue
        shutil.copytree(shared, dst)
        shared_copied.append(shared.name)
    if shared_copied:
        report.append(f"- 스킬이 참조하는 공유 폴더 {len(shared_copied)}개도 함께 옮김: {shared_copied}")
    total_src = len([sk for sk in (power_dir / "skills").iterdir() if (sk / "SKILL.md").exists()])
    if total_src and not placed:
        report.append("- ❌ 스킬을 하나도 옮기지 못했습니다 — 전부 이름이 겹쳐 건너뛰었습니다. "
                       "폴더 이름이 같아도 내용은 다른 플러그인별 전용 스킬입니다 "
                       "(예: `api-patterns`는 여러 플러그인이 같은 이름으로 각자 다른 내용을 담음). "
                       "`--as power`로 다시 옮기면 이름 충돌 없이 Power 안에 별도로 보관됩니다")
    report.append("- Power 로 만들지 않았습니다. 스킬이 `/이름` 슬래시로 호출되고, Kiro 기본 스킬 매칭도 됩니다")
    hooks, agents = [], []
    hook_files = list((power_dir / "dev.kiro/hooks").glob("*.json"))
    # ${CLAUDE_PLUGIN_ROOT}는 Port.run 2단계에서 이미 power_dir 절대경로로 치환돼 있다.
    # 스킬 본문이 skills/ 밖(references/, scripts/ 등)을 그 경로로 참조하면, power_dir가
    # 곧 삭제되므로(호출부에서 rmtree) 훅이 없어도 그 트리를 보존하고 경로를 다시 써야 한다.
    needs_assets = bool(hook_files) or any(
        str(power_dir) in (dst_root / p / "SKILL.md").read_text(errors="ignore")
        for p in placed
    )
    asset_root = None
    if needs_assets:
        asset_root = KIRO / ".kiro-port-assets" / name
        if asset_root.exists():
            shutil.rmtree(asset_root)
        asset_root.parent.mkdir(parents=True, exist_ok=True)
        shutil.copytree(power_dir, asset_root, symlinks=True,
                        ignore=shutil.ignore_patterns("dev.kiro", "PORT-REPORT.md"))
        report.append(f"- 참조 파일을 `{asset_root}` 에 보존했습니다")
        for p in placed:
            skill_md = dst_root / p / "SKILL.md"
            body = skill_md.read_text(errors="ignore")
            new_body = body.replace(str(power_dir), str(asset_root))
            if new_body != body:
                skill_md.write_text(new_body)
    for hook in hook_files:
        dst = KIRO / "hooks" / hook.name
        dst.parent.mkdir(parents=True, exist_ok=True)
        body = hook.read_text()
        if asset_root:
            body = body.replace(str(power_dir), str(asset_root))
        dst.write_text(body); hooks.append(hook.name)
        report.append(f"- 훅 설치: `{dst}` (Power 등록과 무관하게 발화합니다)")
    for ag in (power_dir / "dev.kiro/agents").glob("*.md"):
        dst = KIRO / "agents" / ag.name
        dst.parent.mkdir(parents=True, exist_ok=True)
        if dst.exists():
            report.append(f"- ⚠️ `{dst}` 이미 있어 건너뜀")
            continue
        shutil.copy(ag, dst); agents.append(ag.name)
        report.append(f"- 에이전트 설치: `{dst}` (`kiro-cli --v3 --agent {ag.stem}` 로 시작해야 적용됩니다)")
    _manifest_put(name, {"mode": "skills", "skills": placed, "hooks": hooks, "agents": agents})


def install_project_local(power_dir: Path, project: Path, report: list[str]) -> None:
    """Power 대신 프로젝트의 .kiro/ 에 풀어놓는다 (CC의 project 스코프에 대응)."""
    k = project / ".kiro"
    for sk in (power_dir / "skills").iterdir() if (power_dir / "skills").is_dir() else []:
        dst = k / "skills" / sk.name
        if dst.exists():
            report.append(f"- ⚠️ `{dst}` 이미 있어 건너뜀")
            continue
        shutil.copytree(sk, dst)
    report.append(f"- 스킬 → `{k / 'skills'}`")
    for hook in (power_dir / "dev.kiro/hooks").glob("*.json"):
        (k / "hooks").mkdir(parents=True, exist_ok=True)
        shutil.copy(hook, k / "hooks" / hook.name)
        report.append(f"- 훅 → `{k / 'hooks' / hook.name}`")
    for ag in (power_dir / "dev.kiro/agents").glob("*.md"):
        (k / "agents").mkdir(parents=True, exist_ok=True)
        if not (k / "agents" / ag.name).exists():
            shutil.copy(ag, k / "agents" / ag.name)
            report.append(f"- 에이전트 → `{k / 'agents' / ag.name}`")
    mcp = power_dir / "mcp.json"
    if mcp.exists():
        target = k / "settings/mcp.json"
        cur = _load(target, {"mcpServers": {}})
        cur.setdefault("mcpServers", {}).update(json.loads(mcp.read_text())["mcpServers"])
        _save(target, cur)
        report.append(f"- MCP → `{target}` 에 병합")
    report.append("- 참고: 프로젝트 로컬은 Power가 아니므로 keywords 활성화 없음. 스킬은 Kiro 기본 스킬 매칭으로 동작")


def register(name: str, power_dir: Path, report: list[str]) -> None:
    reg_p = KIRO / "powers/registries/user-added.json"
    reg = _load(reg_p, {"powers": []})
    reg["powers"] = [p for p in reg["powers"] if p["name"] != name]
    reg["powers"].append({"name": name, "description": f"Ported from Claude Code plugin ({power_dir})",
                          "source": {"type": "local", "path": str(power_dir)}, "autoInstall": False})
    _save(reg_p, reg)
    inst_p = KIRO / "powers/installed.json"
    inst = _load(inst_p, {"version": "1.0.0", "installedPowers": [], "dismissedAutoInstalls": []})
    if not any(p["name"] == name for p in inst["installedPowers"]):
        inst["installedPowers"].append({"name": name, "registryId": "user-added"})
    _save(inst_p, inst)
    # Power 밖으로 나가야 하는 것들
    for hook in (power_dir / "dev.kiro/hooks").glob("*.json"):
        dst = KIRO / "hooks" / hook.name
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy(hook, dst)
        report.append(f"- 훅 설치: `{dst}`")
    for ag in (power_dir / "dev.kiro/agents").glob("*.md"):
        dst = KIRO / "agents" / ag.name
        if dst.exists():
            report.append(f"- ⚠️ `{dst}` 이미 있어 건너뜀")
            continue
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy(ag, dst)
        report.append(f"- 에이전트 설치: `{dst}`")


def unregister(name: str) -> None:
    man = _load(MANIFEST, {})
    ent = man.get(name)
    if ent and ent.get("mode") == "skills":
        for sk in ent.get("skills", []):
            d = KIRO / "skills" / sk
            if d.is_dir():
                shutil.rmtree(d)
        for h in ent.get("hooks", []):
            (KIRO / "hooks" / h).unlink(missing_ok=True)
        shutil.rmtree(KIRO / ".kiro-port-assets" / name, ignore_errors=True)
        for a in ent.get("agents", []):
            (KIRO / "agents" / a).unlink(missing_ok=True)
        del man[name]
        _save(MANIFEST, man)
        print(f"removed {name} (스킬 {len(ent.get('skills', []))}개)")
        return
    if ent:
        del man[name]
        _save(MANIFEST, man)
    power_dir = KIRO / "powers/installed" / name
    if power_dir.is_dir():
        for hook in (power_dir / "dev.kiro/hooks").glob("*.json"):
            (KIRO / "hooks" / hook.name).unlink(missing_ok=True)
        for ag in (power_dir / "dev.kiro/agents").glob("*.md"):
            (KIRO / "agents" / ag.name).unlink(missing_ok=True)
        shutil.rmtree(power_dir)
    reg_p = KIRO / "powers/registries/user-added.json"
    reg = _load(reg_p, {"powers": []})
    reg["powers"] = [p for p in reg["powers"] if p["name"] != name]
    _save(reg_p, reg)
    inst_p = KIRO / "powers/installed.json"
    inst = _load(inst_p, {"installedPowers": []})
    inst["installedPowers"] = [p for p in inst["installedPowers"] if p["name"] != name]
    _save(inst_p, inst)
    print(f"removed {name}")


def smoke(names: list[str]) -> None:
    """kiro-cli v3에 실제 로드되는지 확인. TTY가 필요해 script(1)로 감싼다."""
    prompt = "Do not use any tools. List the names of all installed powers you can see, one per line, then stop."
    log = Path("/tmp/kiro-port-smoke.txt")
    subprocess.run(["script", "-q", str(log), "kiro-cli", "chat", "--v3", "--no-interactive", prompt],
                   stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=240)
    seen = log.read_text(errors="replace")
    for n in names:
        print(f"  smoke {n}: {'LOADED' if n in seen else 'NOT SEEN'}")
    pl = sorted((KIRO / "logs").glob("*/powers.log"))
    if pl:
        fails = [ln for ln in pl[-1].read_text().splitlines() if "load.failed" in ln]
        for f in fails:
            print("  powers.log:", f[:200])


# ------------------------------------------------------------------ CLI

def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("cmd", choices=["scan", "port", "unport"])
    ap.add_argument("names", nargs="*")
    ap.add_argument("--all", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--out", type=Path, help="설치하지 않고 이 디렉터리에 Power 저장소만 생성")
    ap.add_argument("--smoke", action="store_true")
    ap.add_argument("--scope", choices=["user", "project", "all"], default="all",
                    help="CC 설치 스코프 필터. 기본: user 전부 + 현재 디렉터리에 해당하는 project")
    ap.add_argument("--project-local", action="store_true",
                    help="Power 대신 현재 디렉터리의 .kiro/ 에 풀어놓기 (project 스코프 대응)")
    ap.add_argument("--from", dest="src", metavar="SOURCE",
                    help="설치 기록 대신 마켓플레이스/플러그인 저장소에서 직접: 로컬 경로 | owner/repo | git URL")
    ap.add_argument("--as", dest="mode", choices=["auto", "skills", "power"], default="auto",
                    help="설치 방식. auto(기본): 스킬만 있으면 ~/.kiro/skills/, 복합이면 Power")
    a = ap.parse_args()
    cwd = Path.cwd().resolve()

    if a.cmd == "unport":
        for n in a.names:
            unregister(n)
        return

    if a.src:
        root = fetch_source(a.src)
        # scan 은 목록만 (원격 항목은 받아오지 않음), port 는 지목된 것만 받아온다
        only = None if a.all else {n.partition("@")[0] for n in a.names}
        cands = marketplace_plugins(root, fetch=(a.cmd == "port"), only=only)
        sources = [{"tool": "market", "name": c["name"], "market": Path(a.src).name, "path": c["path"],
                    "version": c["version"], "scope": "user", "project": "",
                    "remote": c.get("remote")} for c in cands]
        if not sources:
            sys.exit(f"{a.src}: .claude-plugin/marketplace.json 도 plugin.json 도 없음")
    else:
        sources = scan_sources()
    if a.cmd == "scan":
        LABEL = {"skills": "스킬 폴더 복사", "power": "Power", "steering": "steering 수동 배치"}
        print(f"{'플러그인':30} {'출처':7} {'구성':34} 권장")
        for s in sources:
            if not s.get("path"):
                r = s.get("remote") or {}
                print(f"{s['name']:30} {s['market'][:7]:7} 원격: {r.get('url') or r.get('repo','')}")
                continue
            kind, n = classify(Path(s["path"]))
            rec = recommend(kind)
            comp = " ".join(f"{k[:4]}{v}" for k, v in n.items() if v)
            proj = "·프로젝트" if s["scope"] == "project" else ""
            print(f"{s['name']:30} {s['tool']:7} {comp:34} {LABEL[rec]}{proj}")
        print(f"\n전역 스킬 {global_skill_count()}개 (~/.kiro/skills)")
        print("구성에 commands·agents·hooks·mcp 가 있으면 Power, 스킬만이면 폴더 복사가 기본입니다. "
              "`--as skills|power` 로 바꿀 수 있습니다.")
        return

    def in_scope(s: dict) -> bool:
        # project 스코프는 그 프로젝트 안에서 실행할 때만 대상 (CC와 같은 가시성)
        if s["scope"] == "project":
            here = s.get("project") and cwd.is_relative_to(Path(s["project"]).resolve())
            return a.scope in ("project", "all") and bool(here)
        return a.scope in ("user", "all")
    sources = [s for s in sources if in_scope(s)]

    # 선택: name 또는 name@market. 같은 이름이 여러 곳이면 CC 우선, 최신 순
    picked = []
    for key in (["*"] if a.all else a.names):
        n, _, mk = key.partition("@")
        cands = [s for s in sources if (key == "*" or s["name"] == n) and (not mk or s["market"] == mk)]
        unfetched = [s for s in cands if not s.get("path")]
        cands = [s for s in cands if s.get("path")]
        for s in unfetched:
            r = s.get("remote") or {}
            print(f"   ⚠️ {s['name']}: 원격 저장소를 받지 못했습니다 ({r.get('url') or r.get('repo', '?')})")
        if not cands:
            sys.exit(f"not found: {key} (scan 으로 확인)")
        seen = set()
        # 같은 이름이 여러 곳이면 CC 설치본 → Codex 설치본 → 마켓플레이스 원본 순
        for s in sorted(cands, key=lambda s: (s["tool"] != "claude", s["scope"] == "market", s["name"])):
            if s["name"] not in seen:
                seen.add(s["name"])
                picked.append(s)

    if a.project_local:
        base = cwd / ".kiro/.ported"  # 변환 중간물. 실제 파일은 .kiro/{skills,hooks,agents} 로 분배
    else:
        base = a.out or (KIRO / "powers/installed")
    taken = {p.name for p in (KIRO / "powers/installed").iterdir()} if (KIRO / "powers/installed").is_dir() else set()
    for s in picked:
        name = s["name"]
        kind, ncomp = classify(Path(s["path"]))
        mode = a.mode if a.mode != "auto" else recommend(kind)
        if a.project_local:
            mode = "project"
        if mode == "steering":
            print(f"\n== {name}  → 옮기지 않았습니다")
            print(f"   스킬·명령·훅·MCP 가 없어 플러그인이라기보다 지침 문서입니다. Kiro 에서는 "
                  f"`~/.kiro/steering/` 에 `inclusion: always` 머리말을 붙여 두는 자리가 맞고, "
                  f"Power 로 만들면 '항상 적용'이 '키워드 조건부'로 바뀌어 의도가 달라집니다.\n"
                  f"   원본: {s['path']}")
            continue
        if mode == "skills":
            # 훅·에이전트는 Power 밖에 설치되므로 skills 모드에서도 함께 살린다.
            lost = [k for k in ("commands", "mcp") if ncomp[k]]
            if lost:  # 사용자가 --as skills 를 강제한 경우
                print(f"   ⚠️ `{name}` 은 {lost} 도 가지고 있습니다. 스킬만 복사하면 이건 옮겨지지 "
                      f"않습니다. 전부 옮기려면 `--as power` 를 쓰세요.")
        # Power 이름은 Kiro 전체에서 유일해야 한다 (중복이면 Power 목록 전체가 로드되지 않는다)
        if name in taken and not (KIRO / "powers/installed" / name / "PORT-REPORT.md").exists():
            alt = f"{name}-{s['market']}".replace("@", "-")[:64]
            print(f"   ⚠️ `{name}` 은 이미 다른 Power가 쓰는 이름 → `{alt}` 로 설치")
            name = alt
        taken.add(name)
        power_dir = base / name
        where = (f"{cwd}/.kiro/" if mode == "project" else
                 f"{KIRO}/skills/" if mode == "skills" else power_dir)
        why = {"skills": "스킬만 있어 Power 로 감싸지 않음", "power": f"{kind} 구성", "project": "프로젝트 로컬"}[mode]
        print(f"\n== {name}  ({s['tool']} · {s['market']} · {s['scope']})  →  {where}  [{why}]")
        if a.dry_run:
            continue
        if power_dir.exists():
            if not (power_dir / "PORT-REPORT.md").exists():
                print(f"   ⛔ `{power_dir}` 는 이 도구가 만든 Power가 아닙니다 (이미 설치된 Power). 건너뜀. "
                      f"교체하려면 먼저 Kiro에서 제거하세요.")
                continue
            shutil.rmtree(power_dir)
        report = [f"# Port report — {name}", f"source: `{s['path']}` ({s['tool']} marketplace `{s['market']}`, scope {s['scope']})", ""]
        Port(s["path"], power_dir, report).run(name, s["version"])
        if mode == "project":
            install_project_local(power_dir, cwd, report)
        elif mode == "skills" and not a.out:
            install_skills_only(power_dir, report, name)
            shutil.rmtree(power_dir)  # 중간 산출물은 남기지 않는다
        elif not a.out:
            if s["scope"] == "project":
                report.append(f"- ⚠️ 원본은 `{s['project']}` 프로젝트 스코프였으나 Power는 전역 설치됨. "
                              f"프로젝트에만 두려면 그 디렉터리에서 `--project-local`")
            register(name, power_dir, report)
        report.append("")
        report.append("## 사람이 확인할 것")
        if mode == "skills":
            lost = [k for k in ("commands", "mcp") if ncomp[k]]
            if lost:
                report.append(f"- ❌ {lost} 는 옮겨지지 않았습니다 — Power 만 담을 수 있습니다 (`--as power`)")
            report += [f"- 스킬은 `{KIRO}/skills/` 에 있습니다. 이름이 겹치면 건너뛰었으니 위 ⚠️ 를 확인하세요",
                       "- keywords 자동 활성화가 필요하면 `--as power` 로 다시 옮기세요"]
        else:
            report += ["- `plugin.json`의 `keywords` — 이름에서 기계적으로 뽑았음. 이 Power가 켜져야 하는 상황의 단어로 다듬기",
                       "- 훅이 있었다면 `~/.kiro/hooks/`에 복사됐는지, 도구명 매핑이 맞는지",
                       "- 에이전트는 `~/.kiro/agents/`에 마크다운 그대로. 도구 제한(`tools`)은 제거됨"]
        if power_dir.exists():
            (power_dir / "PORT-REPORT.md").write_text("\n".join(report) + "\n")
        else:  # skills 모드는 Power 디렉터리를 남기지 않으므로 별도 보관
            rp = KIRO / ".kiro-port-reports" / f"{name}.md"
            rp.parent.mkdir(parents=True, exist_ok=True)
            rp.write_text("\n".join(report) + "\n")
        print("\n".join(report[3:]))
    if not a.dry_run and not a.out and not a.project_local:
        reg = [p["name"] for p in _load(KIRO / "powers/installed.json", {"installedPowers": []})["installedPowers"]]
        nskill = sum(1 for n in reg for _ in (KIRO / "powers/installed" / n / "skills").glob("*/SKILL.md"))
        nfile = sum(1 for n in reg for p in (KIRO / "powers/installed" / n).rglob("*") if p.is_file())
        print(f"\n등록 Power {len(reg)}개 · 스킬 {nskill}개 · 파일 {nfile}개")
        if nfile > FILE_WARN * 2:
            print(f"⚠️  파일이 {nfile}개입니다. Kiro 는 스킬 트리의 모든 파일마다 fd 를 열어두므로"
                  f"(kirodotdev/Kiro#10625) `spawn EBADF` 로 셸이 멈출 수 있습니다.")
    if a.smoke and not a.dry_run and not a.out:
        print("\n== smoke test (kiro-cli --v3)")
        smoke([s["name"] for s in picked])


if __name__ == "__main__":
    main()
