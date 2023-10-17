import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_cognito as cognito } from 'aws-cdk-lib';
import * as fs from 'fs';
import * as core from 'aws-cdk-lib/core';

export interface CognitoKakaoProps {
  accountId: string;
}

export class CognitoKakao extends Construct {

    public readonly userPool: cognito.UserPool;
    
    constructor(scope: Construct, id: string, props: CognitoKakaoProps) {
        super(scope, id);

        const configFilePath = 'app.json';
        const configData = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
    
        const clientId = configData.clientId;
        const clientSecret = configData.clientSecret;
        const issuerUrl = configData.issuerUrl;
        const callbackUrls = [configData.callbackUrl];
        const logoutUrls = [configData.logoutUrl];
        const domainPrefix = configData.cognitoDomainPrefix + process.env.CDK_DEFAULT_ACCOUNT;

        this.userPool = new cognito.UserPool(this, 'CognitoKakaoUserPool');

        this.userPool.addDomain('CognitoKakaoDomain', {
          cognitoDomain: { domainPrefix: domainPrefix }
        });

        const provider = new cognito.UserPoolIdentityProviderOidc(this, 'KakaoProvider', {
            clientId: clientId,
            clientSecret: clientSecret,
            issuerUrl: issuerUrl,
            userPool: this.userPool,
            attributeRequestMethod: cognito.OidcAttributeRequestMethod.GET,
            name: 'KakaoProvider',
            scopes: ['openid']
        });

        const client = this.userPool.addClient('appClient', {
            supportedIdentityProviders: [
              cognito.UserPoolClientIdentityProvider.custom(provider.providerName)
            ],
            oAuth: {
              flows: {
                authorizationCodeGrant: true
              },
              scopes: [ cognito.OAuthScope.OPENID, cognito.OAuthScope.EMAIL ],
              callbackUrls: callbackUrls,
              logoutUrls: logoutUrls,
            },
          });

        client.node.addDependency(provider);

        new core.CfnOutput(this, 'CognitoUserPoolId', {
          value: this.userPool.userPoolId
        });

        new core.CfnOutput(this, 'CognitoUserPoolClientId', {
          value: client.userPoolClientId
        });

        new core.CfnOutput(this, 'CognitoUserPoolDomainPrefix', {
          value: domainPrefix
        });
        
    }
  }