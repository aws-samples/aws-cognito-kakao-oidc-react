import React from "react";
import { Navbar, Button, Container } from "react-bootstrap";
import { Auth } from "aws-amplify";

function TopBar(props) {
  return (
    <Navbar bg="light" data-bs-theme="light" key="lg" expand="lg" className="bg-body-tertiary mb-3">
      <Container fluid>
        <Navbar.Brand href="#" style={{ fontWeight: 'bold' }}>Wisdom Box</Navbar.Brand>
        {props.user ? (
          <Button block
            style={{
              backgroundColor: '#FEE500',
              borderColor: '#FEE500',
              color: 'black'
            }}
            onClick={() => Auth.signOut()}>
            Sign Out
          </Button>
        ) : null}
      </Container>
    </Navbar>
  );
}

export default TopBar;
