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
3. In the left panel's "Summary" menu, make a note of the "APP Key > **REST API Key**" ***- (1)***
4. In the left panel, under "Kakao Login > Security," generate the **Client Secret** after issuance and make a note of it. ***- (2)***



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

7. Make sure to take a note of the **Service URL** that is printed out on the last of the screen.. ***-- (3)***



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

4. Run `cdk deploy` to initiate the deployment. When you run the deployment, it will configure the following AWS services.

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

5. In the [Kakao Developer](https://developers.kakao.com/) site, set the Redirect URI under the Kakao Login product settings page for Kakao Login as follows:

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
