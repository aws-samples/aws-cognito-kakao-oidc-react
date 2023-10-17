import React from "react";
import {Button, Container} from "react-bootstrap";
import {Auth} from "aws-amplify";

function KakaoLogin(props) {
  return (
    <Container style={{ fontFamily: 'Arial', lineHeight: '30px'}}>
      Please sign-in to preceed <br />
      <Button block
        style={{
          backgroundColor: '#FEE500',
          borderColor: '#FEE500',
          color: 'black'
        }}
        onClick={() => Auth.federatedSignIn({provider: props.identityProvider})}>
        Sign in with Kakao
      </Button>
    </Container>
  );
}

export default KakaoLogin;
