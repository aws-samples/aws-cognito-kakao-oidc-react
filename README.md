English follows Korean | 한국어버전 뒤에 영어버전이 있습니다



## Introduction

이 코스 샘플은 [Amazon Cognito](https://aws.amazon.com/cognito/) 에서 [OIDC(OpenID Connect)](https://openid.net/developers/how-connect-works/)을 통해서 Kakao 로그인 하는 React 애플리케이션을 구현합니다. 



## Overview

여기서는  Kakao 로그인을 Identity Provider로 하는 Amazon Cognito를 구성하고, 테스트를 위한 백앤드 애플리케이션 서비스 구성하는 [AWS CDK](https://aws.amazon.com/cdk/) 프로젝트와, CDK를 통해 생성한 리소스를 사용해서 Kakao로 로그인하는 예제를 담고있는 React 애플리케이션으로 구성되어 있습니다. 

* cdk 디렉터리: 인증을 위한 Amazon Cognito, 백앤드 API 앤드포인트 Amazon API Gateway, 백앤드 서비스인 AWS Lambda 함수를 생성하는 CDK 프로젝트
* app 디렉터리: Kakao 인증을 사용해 로그인 한 사용자에 대해 서비스를 제공하는 React 프로젝트



## How to Run

### 1. Kakao 애플리케이션 생성

1. [Kakao Developers](https://developers.kakao.com/) 로그인 합니다.
2. 상단의 '내 애플리케이션'을 클릭하고 들어가서, 새로운 애플리케이션을 생성합니다.
3. 좌측 패널의 '요약 정보' 메뉴에서 APP Key > REST API Key 를 메모합니다. **-- (1)**
4. 좌측 패널의 '카카오 로그인' 에서, `활성화 설정`은 ON, `OpenID Connect 활성화 설정`을 ON 으로 합니다.
5. 좌측 패널의 '카카오 로그인' > '보안' 에서, Client Secret 을 발급받은 후 `코드` 값을 메모합니다. **-- (2)**



### 2. 애플리케이션 환경 구성

React 애플리케이션을 배포할 때 편의상 [AWS Amplify](https://docs.amplify.aws/) 의 Hosting 기능을 사용해서 배포합니다.

1. 아래와 같이 [Amplify CLI](https://docs.amplify.aws/cli/)를 설치합니다. 

   ```
   $ npm install -g @aws-amplify/cli
   ```

2. `app` 디렉터리로 이동 합니다.

3. `amplify init` 명령을 실행해서 Amplify 프로젝트를 초기화 합니다. 프로젝트 이름 설정 후 나머지는 기본값으로 진행합니다.

   * Select the authentication method you want to use: 에서는 기존에 설정한 AWS Profile이 있다면 그것을 이용하거나, 직접 AWS access keys를 입력해도 됩니다. 이 Amplify에 대한 별도의 AWS Profile 을 구성하고 싶다면 [Configure the Amplify CLI](https://docs.amplify.aws/cli/start/install/#configure-the-amplify-cli) 문서를 참고해주세요.

   ```
   $ amplify init
   Note: It is recommended to run this command from the root of your app directory
   ? Enter a name for the project awscognitokakaooidcr
   The following configuration will be applied:
   
   Project information
   | Name: awscognitokakaooidc
   | Environment: dev
   | Default editor: Visual Studio Code
   | App type: javascript
   | Javascript framework: react
   | Source Directory Path: src
   | Distribution Directory Path: build
   | Build Command: npm run-script build
   | Start Command: npm run-script start
   
   ? Initialize the project with the above configuration? Yes
   Using default provider  awscloudformation
   ? Select the authentication method you want to use: AWS profile
   
   For more information on AWS Profiles, see:
   https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-profiles.html
   
   ? Please choose the profile you want to use default
   Adding backend environment dev to AWS Amplify app: d3kb7hrd0defgz
   ```

4. `amplify hosting add` 명령으로 호스팅 환경을 구성합니다. 선택 옵션은 모두 기본값으로 선택합니다. (<엔터> 키로 기본값 설정)

   ```
   $ amplify hosting add
   ✔ Select the plugin module to execute · Hosting with Amplify Console (Managed hosting with custom domains, Continuous deployment)
   ? Choose a type Manual deployment
   
   You can now publish your app using the following command:
   
   Command: amplify publish
   ```

5. `amplify publish` 명령으로 React 애플리케이션을 발행합니다.

6. 화면에 하단에 출력되는 서비스 URL을 메모합니다. **-- (3)**



### 3. AWS 리소스 구성 

Amazon Cognito를 포함한, 백엔드 리소스를 생성합니다. AWS 리소스는 AWS CDK를 사용해서 생성하게 됩니다.

1. `npm install -g aws-cdk` 를 실행해서 [AWS CDK Toolkit](https://docs.aws.amazon.com/cdk/v2/guide/cli.html) 을 설치합니다.

2. `app.json` 파일을 열어서 각 property 의 값을 위에서 메모한 값으로 설정합니다. 

   ```
   {
       "clientId": <REST API Key from (1)>,
       "clientSecret": <Client Secret from (2)>",
       "issuerUrl": "https://kauth.kakao.com",
       "callbackUrl": "<Service URL from (3)>",
       "logoutUrl": "<Service URL from (3)>",
       "cognitoDomainPrefix": "kakao-oidc-"
   }
   ```

3. `npm install` 을 실행해서 패키를 설치합니다.

4. `cdk bootstrap` 을 실행해서 현재 계정에 대한 CDK 환경을 구성합니다.

5. `cdk deploy` 를 실행해서 배포합니다. 배포를 실행하면 다음과 같은 AWS 서비스를 구성합니다.

   * Amazon Cognito: Kakao 로그인을 Identity Provider로 사용하도록 구성한 인증 서비스
   * Amazon API Gateway: 서비스 Endpoint, API 요청을 보낼 때 Kakao 로그인 시 받은 인증코드를 요청 헤더에 넣어 보내서 Cognito를 통해 해당 인증 코드를 검증 후, 인증된 사용자라면 해댱 요청에 연결된 Lambda 함수를 호출합니다.
   * AWS Lambda: 서비스 Endpoint 를 통해 실행되는 백앤드 함수 서비스

   ```
   $ cdk deploy
   
   ✨  Synthesis time: 2.79s
   
   CognitoKakaoOIDC:  start: Building 5f584819bb4daa567c74cff36db6ad8aa86384f7aa5ea87968517339ebb4f6ad:current_account-current_region
   CognitoKakaoOIDC:  success: Built 5f584819bb4daa567c74cff36db6ad8aa86384f7aa5ea87968517339ebb4f6ad:current_account-current_region
   CognitoKakaoOIDC:  start: Publishing 5f584819bb4daa567c74cff36db6ad8aa86384f7aa5ea87968517339ebb4f6ad:current_account-current_region
   CognitoKakaoOIDC:  success: Published 5f584819bb4daa567c74cff36db6ad8aa86384f7aa5ea87968517339ebb4f6ad:current_account-current_region
   CognitoKakaoOIDC: deploying... [1/1]
   CognitoKakaoOIDC: creating CloudFormation changeset...
   
    ✅  CognitoKakaoOIDC
   
   ✨  Deployment time: 11.38s
   
   Outputs:
   CognitoKakaoOIDC.CognitoKakaoCognitoUserPoolClientIdC64E0A60 = ehk0v05g56u8tlpm4hd9ndu7i
   CognitoKakaoOIDC.CognitoKakaoCognitoUserPoolDomainPrefix67F1CBC9 = kakao-oidc-803936485311
   CognitoKakaoOIDC.CognitoKakaoCognitoUserPoolIdD8B52A3A = ap-northeast-2_D7MVo9agp
   CognitoKakaoOIDC.QuotesApiEndpoint12EC1C79 = https://d94x3w0wdf.execute-api.ap-northeast-2.amazonaws.com/prod/
   Stack ARN:
   arn:aws:cloudformation:ap-northeast-2:803936485311:stack/CognitoKakaoOIDC/ee4f6fe0-68a5-11ee-9e3b-0a9db66fa1b2
   
   ✨  Total time: 14.16s
   ```

   배포가 완료되면 Outputs 에 리소스 정보가 출력됩니다. 이 값들은 이후 구성에서 사용하므로 **모두 메모**합니다.

6. Kakao Developers 의 '카카오 로그인' 에서 Redirect URI 를 아래와 같이 설정합니다

   ```
   https://<CognitoKakaoCognitoUserPoolDomainPrefix>.auth.ap-northeast-2.amazoncognito.com/oauth2/idpresponse
   ```

   

### 4. 애플리케이션의 환경 구성

app 디렉터리로 이동 후 `src/App.js` 파일을 열어 인증을 구성하고 서비스 앤드포인트 호출을 위한 프로퍼티 값을 입력합니다. 값을 입력할 때 위에서 메모했던 값들을 그대로 사용합니다.

```
...
Auth.configure({
  region: "ap-northeast-2",
  userPoolId: "<CognitoKakaoCognitoUserPoolId>",
  userPoolWebClientId: "<CognitoKakaoCognitoUserPoolClientId>",
  oauth: {
    domain: "<CognitoKakaoCognitoUserPoolDomainPrefix>.auth.ap-northeast-2.amazoncognito.com",
    scope: ["email", "openid"],
    redirectSignIn: "<Service URL from (3)>",
    redirectSignOut: "<Service URL from (3)>",
    responseType: "code"
  }
});

const apiEndpoint = '<QuotesApiEndpoint>';
const identityProvider = "KakaoProvider";
...
```

`amplify publish` 명령을 실행해서 애플리케이션을 배포합니다.



### 5. 애플리케이션 실행

1. `amplify publish` 를 실행했을 때 출력되는 서비스 URL로 접속합니다. 
2. Sign in with Kakao 버튼을 클릭하면 Kakao 로그인 화면이 표시되면, Kakao ID, Password를 입력합니다.
3. 인증이 성공되면 애플리케이션은 API Gateway를 호출하고, 인증키가 유효하다면 Lambda 함수를 호출한 결과를 화면에 출력합니다.
4. 끝 !



## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.



----
*(English Version)*



## Introduction

This sample demonstrates the code for sign-in with Kakao using OIDC(OpenID Connect) in Amazon Cognito.



## Overview

This project consists of CDK code for configuring AWS resources include Amazon Cognito and backend services for testing and a React application that utilizes Amazon Cognito for sign-in with Kakao.

* `cdk` directory: CDK project
* `app` directory: React application project



## How to Run

### 1. Create an application in the Kakao Developers site

1. Log-in into the [Kakao Developers](https://developers.kakao.com/) site
2. Add a new application in 'My Application' menu.
3. In the left panel's 'Summary' menu, make a note of the "APP Key > **REST API Key**" ***- (1)***
4. In the left panel's 'Kakao Login' menu, make the `Kakao Login Activation` and `OpenID Connect Activation` to ON
5. In the left panel, under 'Kakao Login > Security', generate the **Client Secret** after issuance and make a note of it. ***- (2)***



### 2. Configuring the initial application

For the convenience of deploying the React application, you can use AWS Amplify's Hosting feature.

1. Install the Amplify CLI as follows:

   ```
   $ npm install -g @aws-amplify/cli
   ```

2. Move into the **app** directory.

3. Run  `npm install` to install dependency packages.

4. Run  `amplify init` command to initialize your Amplify project. Set the project name and proceed with the default values for the rest of the configuration.

   * Select the authentication method you want to use: If you have an existing AWS profile, you can choose your profile as you prefer, or you can manually enter your AWS access keys. If you want to configure a separate AWS profile specifically for Amplify, please refer to the [Configure the Amplify CLI](https://docs.amplify.aws/cli/start/install/#configure-the-amplify-cli) documentation for guidance.

   ```
   $ amplify init
   Note: It is recommended to run this command from the root of your app directory
   ? Enter a name for the project awscognitokakaooidcr
   The following configuration will be applied:
   
   Project information
   | Name: awscognitokakaooidc
   | Environment: dev
   | Default editor: Visual Studio Code
   | App type: javascript
   | Javascript framework: react
   | Source Directory Path: src
   | Distribution Directory Path: build
   | Build Command: npm run-script build
   | Start Command: npm run-script start
   
   ? Initialize the project with the above configuration? Yes
   Using default provider  awscloudformation
   ? Select the authentication method you want to use: AWS profile
   
   For more information on AWS Profiles, see:
   https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-profiles.html
   
   ? Please choose the profile you want to use default
   Adding backend environment dev to AWS Amplify app: d3kb7hrd0defgz
   ```

5. Configure the hosting environment using the `amplify hosting add` command. Choose the default options for the selected options. (Press <Enter> key)

   ```
   $ amplify hosting add
   ✔ Select the plugin module to execute · Hosting with Amplify Console (Managed hosting with custom domains, Continuous deployment)
   ? Choose a type Manual deployment
   
   You can now publish your app using the following command:
   
   Command: amplify publish
   ```

6. Publish this react application with `amplify publish` command.

7. Make sure to take a note of the service **URL** that is printed out on the last of the screen.. ***-- (3)***



### 3. AWS 리소스 구성 

You will create the necessary resources for login testing, including Amazon Cognito, using AWS CDK to provision AWS resources.

1. Run `npm install -g aws-cdk ` to setup [AWS CDK Toolkit](https://docs.aws.amazon.com/cdk/v2/guide/cli.html)

2. Open the `app.json` file and set the values of each property to the values you've noted from earlier. 

   ```
   {
       "clientId": "<REST API Key from (1)>",
       "clientSecret": "<Client Secret from (2)>",
       "issuerUrl": "https://kauth.kakao.com",
       "callbackUrl": "<Service URL from (3)>",
       "logoutUrl": "<Service URL from (3)>",
       "cognitoDomainPrefix": "kakao-oidc-"
   }
   ```
3. Run `npm install` to install dependent packages

4. Run `cdk bootstarp` to initialize CDK environment.

5. Run `cdk deploy` to initiate the deployment. When you run the deployment, it will configure the following AWS services.

   * Amazon Cognito: Amazon Cognito instance to use Kakao Login as an Identity Provider
   * Amazon API Gateway: A service endpoint for testing. Upon successful Kakao Login, validate the received authentication token to ensure its validity, and then proceed to call the backend function.
   * AWS Lambda: The backend function service is executed through the service endpoint.

   ```
   $ cdk deploy
   
   ✨  Synthesis time: 2.79s
   
   CognitoKakaoOIDC:  start: Building 5f584819bb4daa567c74cff36db6ad8aa86384f7aa5ea87968517339ebb4f6ad:current_account-current_region
   CognitoKakaoOIDC:  success: Built 5f584819bb4daa567c74cff36db6ad8aa86384f7aa5ea87968517339ebb4f6ad:current_account-current_region
   CognitoKakaoOIDC:  start: Publishing 5f584819bb4daa567c74cff36db6ad8aa86384f7aa5ea87968517339ebb4f6ad:current_account-current_region
   CognitoKakaoOIDC:  success: Published 5f584819bb4daa567c74cff36db6ad8aa86384f7aa5ea87968517339ebb4f6ad:current_account-current_region
   CognitoKakaoOIDC: deploying... [1/1]
   CognitoKakaoOIDC: creating CloudFormation changeset...
   
    ✅  CognitoKakaoOIDC
   
   ✨  Deployment time: 11.38s
   
   Outputs:
   CognitoKakaoOIDC.CognitoKakaoCognitoUserPoolClientIdC64E0A60 = ehk0v05g56u8tlpm4hd9ndu7i
   CognitoKakaoOIDC.CognitoKakaoCognitoUserPoolDomainPrefix67F1CBC9 = kakao-oidc-803936485311
   CognitoKakaoOIDC.CognitoKakaoCognitoUserPoolIdD8B52A3A = ap-northeast-2_D7MVo9agp
   CognitoKakaoOIDC.QuotesApiEndpoint12EC1C79 = https://d94x3w0wdf.execute-api.ap-northeast-2.amazonaws.com/prod/
   Stack ARN:
   arn:aws:cloudformation:ap-northeast-2:803936485311:stack/CognitoKakaoOIDC/ee4f6fe0-68a5-11ee-9e3b-0a9db66fa1b2
   
   ✨  Total time: 14.16s
   ```

   Once the deployment is complete, the resource information will be displayed in the **Outputs**. It's essential to **make a note of all these values**, as they will be used in the subsequent configuration.

6. In the [Kakao Developer](https://developers.kakao.com/) site, set the Redirect URI under the Kakao Login product settings page for Kakao Login as follows:

   `https://<CognitoKakaoCognitoUserPoolDomainPrefix>.auth.ap-northeast-2.amazoncognito.com/oauth2/idpresponse`



### 4. Configuring the application for authentication

Open the `src/App.js` file in the `app` directory to configure authentication and update the properties for calling the service endpoint.

```
...
Auth.configure({
  region: "ap-northeast-2",
  userPoolId: "<CognitoKakaoCognitoUserPoolId>",
  userPoolWebClientId: "<CognitoKakaoCognitoUserPoolClientId>",
  oauth: {
    domain: "<CognitoKakaoCognitoUserPoolDomainPrefix>.auth.ap-northeast-2.amazoncognito.com",
    scope: ["email", "openid"],
    redirectSignIn: "<Service URL from (3)>",
    redirectSignOut: "<Service URL from (3)>",
    responseType: "code"
  }
});

const apiEndpoint = '<QuotesApiEndpoint>';
const identityProvider = "KakaoProvider";
...
```

Run the `amplify publish` command to deploy the application.



### 5. Run the application

1. Access the service URL that is displayed when you run `amplify publish` in a web browser.
2. Click the "Sign in with Kakao" button, and when the Kakao login screen appears, enter your Kakao ID and password.
3. If the authentication is successful, the app will call API Gateway. If your authentication key is valid, it will execute a Lambda function and display the results on your web browser.
4. End !




## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.
