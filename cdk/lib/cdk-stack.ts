import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as lambda from "aws-cdk-lib/aws-lambda";
import { CognitoKakao } from './cognito-kakao';

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const quotesFunction = new lambda.Function(this, "QuotesFunction", {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset("lambda"),
      handler: "app.lambdaHandler",
    });
    
    const cognito = new CognitoKakao(this, "CognitoKakao", {
      accountId: this.account
    }); 
    
    const authorizer = new apigw.CognitoUserPoolsAuthorizer(this, 'cognitoKakaoAuthorizer', {
      cognitoUserPools: [cognito.userPool]
    });

    const quotesApi = new apigw.RestApi(this, "QuotesApi");

    const quotesResource = quotesApi.root.addResource("quote");
    quotesResource.addCorsPreflight({
      allowOrigins: apigw.Cors.ALL_ORIGINS,
      allowMethods: apigw.Cors.ALL_METHODS
    });
    
    quotesResource.addMethod("GET", new apigw.LambdaIntegration(quotesFunction), {
      authorizer: authorizer,
      authorizationType: apigw.AuthorizationType.COGNITO
    });
  }
}
