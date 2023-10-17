import React, {useEffect, useState, Fragment} from "react";
import {Amplify, Auth, Hub} from "aws-amplify";
import { Container } from "react-bootstrap";
import './App.css';
import awsExports from './aws-exports';

import KakaoLogin from "./KakaoLogin";
import TopBar from "./TopBar";
import Message from "./Message";

Amplify.configure(awsExports);

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

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    getUser();
    Hub.listen("auth", ({payload: {event, data}}) => {
      switch (event) {
        case "signIn":
          setUser(data);
          console.log("signIn user ="+JSON.stringify(data));
          console.log("token ="+data.signInUserSession.idToken.jwtToken);
          break;
        case "signOut":
          setUser(null);
          break;
        default:
          console.log("event ="+ event);
          break;
      }
    });
  }, []);

  function getUser() {
    return Auth.currentAuthenticatedUser()
        .then(user => setUser(user))
        .catch(err => {
            console.error(err);
            console.log("Not signed in");
        });
  };
  
  return (
    <Fragment>
      <TopBar user={user} />
      <Container fluid>
        <br />
        {user ? (
          <Message authToken={user.signInUserSession.idToken.jwtToken} apiEndpoint={apiEndpoint} />
        ) : (
          <KakaoLogin identityProvider={identityProvider} />
        )}
      </Container>
    </Fragment>
  );
}

export default App;
