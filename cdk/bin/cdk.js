#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("source-map-support/register");
const cdk = require("aws-cdk-lib");
const cdk_stack_1 = require("../lib/cdk-stack");
// const appConfig = {
//   clientId: 'ae0fe18548be523e32be10a9c50504ed',
//   clientSecret: 'c3qSODBKGoffrWeWCZbMVkycFY9bMgj0',
//   issuerUrl: 'https://kauth.kakao.com',
//   callbackUrls: ['https://dev.d219nc0ipbegcw.amplifyapp.com'],
//   logoutUrls: ['https://dev.d219nc0ipbegcw.amplifyapp.com'],
// }
const app = new cdk.App();
new cdk_stack_1.CdkStack(app, 'CognitoKakaoOIDC', {
/* If you don't specify 'env', this stack will be environment-agnostic.
 * Account/Region-dependent features and context lookups will not work,
 * but a single synthesized template can be deployed anywhere. */
/* Uncomment the next line to specialize this stack for the AWS Account
 * and Region that are implied by the current CLI configuration. */
// env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
/* Uncomment the next line if you know exactly what Account and Region you
 * want to deploy the stack to. */
// env: { account: '123456789012', region: 'us-east-1' },
/* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2RrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY2RrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLHVDQUFxQztBQUNyQyxtQ0FBbUM7QUFDbkMsZ0RBQTRDO0FBRzVDLHNCQUFzQjtBQUN0QixrREFBa0Q7QUFDbEQsc0RBQXNEO0FBQ3RELDBDQUEwQztBQUMxQyxpRUFBaUU7QUFDakUsK0RBQStEO0FBQy9ELElBQUk7QUFFSixNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUMxQixJQUFJLG9CQUFRLENBQUMsR0FBRyxFQUFFLGtCQUFrQixFQUFFO0FBQ3BDOztpRUFFaUU7QUFFakU7bUVBQ21FO0FBQ25FLDZGQUE2RjtBQUU3RjtrQ0FDa0M7QUFDbEMseURBQXlEO0FBRXpELDhGQUE4RjtDQUMvRixDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIjIS91c3IvYmluL2VudiBub2RlXG5pbXBvcnQgJ3NvdXJjZS1tYXAtc3VwcG9ydC9yZWdpc3Rlcic7XG5pbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgQ2RrU3RhY2sgfSBmcm9tICcuLi9saWIvY2RrLXN0YWNrJztcblxuXG4vLyBjb25zdCBhcHBDb25maWcgPSB7XG4vLyAgIGNsaWVudElkOiAnYWUwZmUxODU0OGJlNTIzZTMyYmUxMGE5YzUwNTA0ZWQnLFxuLy8gICBjbGllbnRTZWNyZXQ6ICdjM3FTT0RCS0dvZmZyV2VXQ1piTVZreWNGWTliTWdqMCcsXG4vLyAgIGlzc3VlclVybDogJ2h0dHBzOi8va2F1dGgua2FrYW8uY29tJyxcbi8vICAgY2FsbGJhY2tVcmxzOiBbJ2h0dHBzOi8vZGV2LmQyMTluYzBpcGJlZ2N3LmFtcGxpZnlhcHAuY29tJ10sXG4vLyAgIGxvZ291dFVybHM6IFsnaHR0cHM6Ly9kZXYuZDIxOW5jMGlwYmVnY3cuYW1wbGlmeWFwcC5jb20nXSxcbi8vIH1cblxuY29uc3QgYXBwID0gbmV3IGNkay5BcHAoKTtcbm5ldyBDZGtTdGFjayhhcHAsICdDb2duaXRvS2FrYW9PSURDJywge1xuICAvKiBJZiB5b3UgZG9uJ3Qgc3BlY2lmeSAnZW52JywgdGhpcyBzdGFjayB3aWxsIGJlIGVudmlyb25tZW50LWFnbm9zdGljLlxuICAgKiBBY2NvdW50L1JlZ2lvbi1kZXBlbmRlbnQgZmVhdHVyZXMgYW5kIGNvbnRleHQgbG9va3VwcyB3aWxsIG5vdCB3b3JrLFxuICAgKiBidXQgYSBzaW5nbGUgc3ludGhlc2l6ZWQgdGVtcGxhdGUgY2FuIGJlIGRlcGxveWVkIGFueXdoZXJlLiAqL1xuXG4gIC8qIFVuY29tbWVudCB0aGUgbmV4dCBsaW5lIHRvIHNwZWNpYWxpemUgdGhpcyBzdGFjayBmb3IgdGhlIEFXUyBBY2NvdW50XG4gICAqIGFuZCBSZWdpb24gdGhhdCBhcmUgaW1wbGllZCBieSB0aGUgY3VycmVudCBDTEkgY29uZmlndXJhdGlvbi4gKi9cbiAgLy8gZW52OiB7IGFjY291bnQ6IHByb2Nlc3MuZW52LkNES19ERUZBVUxUX0FDQ09VTlQsIHJlZ2lvbjogcHJvY2Vzcy5lbnYuQ0RLX0RFRkFVTFRfUkVHSU9OIH0sXG5cbiAgLyogVW5jb21tZW50IHRoZSBuZXh0IGxpbmUgaWYgeW91IGtub3cgZXhhY3RseSB3aGF0IEFjY291bnQgYW5kIFJlZ2lvbiB5b3VcbiAgICogd2FudCB0byBkZXBsb3kgdGhlIHN0YWNrIHRvLiAqL1xuICAvLyBlbnY6IHsgYWNjb3VudDogJzEyMzQ1Njc4OTAxMicsIHJlZ2lvbjogJ3VzLWVhc3QtMScgfSxcblxuICAvKiBGb3IgbW9yZSBpbmZvcm1hdGlvbiwgc2VlIGh0dHBzOi8vZG9jcy5hd3MuYW1hem9uLmNvbS9jZGsvbGF0ZXN0L2d1aWRlL2Vudmlyb25tZW50cy5odG1sICovXG59KTtcbiJdfQ==