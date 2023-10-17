import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_cognito as cognito } from 'aws-cdk-lib';
export declare class CognitoKakao extends Construct {
    readonly userPool: cognito.UserPool;
    constructor(scope: Construct, id: string, props?: cdk.StackProps);
}
