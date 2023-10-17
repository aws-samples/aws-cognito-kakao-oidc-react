"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cognito = void 0;
const cdk = require("aws-cdk-lib");
const aws_cdk_lib_1 = require("aws-cdk-lib");
class Cognito extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const clientId = 'ae0fe18548be523e32be10a9c50504ed';
        const clientSecret = 'c3qSODBKGoffrWeWCZbMVkycFY9bMgj0';
        const issuerUrl = 'https://kauth.kakao.com';
        const callbackUrls = ['https://dev.d219nc0ipbegcw.amplifyapp.com'];
        const logoutUrls = ['https://dev.d219nc0ipbegcw.amplifyapp.com'];
        const userPool = new aws_cdk_lib_1.aws_cognito.UserPool(this, 'CognitoKakaoUserPool');
        const provider = new aws_cdk_lib_1.aws_cognito.UserPoolIdentityProviderOidc(this, 'KakaoProvider', {
            clientId: clientId,
            clientSecret: clientSecret,
            issuerUrl: issuerUrl,
            userPool: userPool,
            attributeRequestMethod: aws_cdk_lib_1.aws_cognito.OidcAttributeRequestMethod.GET,
            name: issuerUrl,
            scopes: ['openid']
        });
        const client = userPool.addClient('appClient', {
            supportedIdentityProviders: [
                aws_cdk_lib_1.aws_cognito.UserPoolClientIdentityProvider.custom
            ],
            oAuth: {
                flows: {
                    authorizationCodeGrant: true,
                },
                scopes: [aws_cdk_lib_1.aws_cognito.OAuthScope.OPENID, aws_cdk_lib_1.aws_cognito.OAuthScope.EMAIL],
                callbackUrls: callbackUrls,
                logoutUrls: logoutUrls,
            },
        });
        client.node.addDependency(provider);
    }
}
exports.Cognito = Cognito;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29nbml0by5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNvZ25pdG8udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsbUNBQW1DO0FBR25DLDZDQUFxRDtBQUdyRCxNQUFhLE9BQVEsU0FBUSxHQUFHLENBQUMsS0FBSztJQUNsQyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXNCO1FBQzVELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLE1BQU0sUUFBUSxHQUFHLGtDQUFrQyxDQUFDO1FBQ3BELE1BQU0sWUFBWSxHQUFHLGtDQUFrQyxDQUFDO1FBQ3hELE1BQU0sU0FBUyxHQUFHLHlCQUF5QixDQUFDO1FBQzVDLE1BQU0sWUFBWSxHQUFHLENBQUMsMkNBQTJDLENBQUMsQ0FBQztRQUNuRSxNQUFNLFVBQVUsR0FBRyxDQUFDLDJDQUEyQyxDQUFDLENBQUM7UUFFakUsTUFBTSxRQUFRLEdBQUcsSUFBSSx5QkFBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsc0JBQXNCLENBQUMsQ0FBQztRQUVwRSxNQUFNLFFBQVEsR0FBRyxJQUFJLHlCQUFPLENBQUMsNEJBQTRCLENBQUMsSUFBSSxFQUFFLGVBQWUsRUFBRTtZQUM3RSxRQUFRLEVBQUUsUUFBUTtZQUNsQixZQUFZLEVBQUUsWUFBWTtZQUMxQixTQUFTLEVBQUUsU0FBUztZQUNwQixRQUFRLEVBQUUsUUFBUTtZQUNsQixzQkFBc0IsRUFBRSx5QkFBTyxDQUFDLDBCQUEwQixDQUFDLEdBQUc7WUFDOUQsSUFBSSxFQUFFLFNBQVM7WUFDZixNQUFNLEVBQUUsQ0FBQyxRQUFRLENBQUM7U0FDckIsQ0FBQyxDQUFDO1FBRUgsTUFBTSxNQUFNLEdBQUcsUUFBUSxDQUFDLFNBQVMsQ0FBQyxXQUFXLEVBQUU7WUFDM0MsMEJBQTBCLEVBQUU7Z0JBQ3hCLHlCQUFPLENBQUMsOEJBQThCLENBQUMsTUFBTTthQUNoRDtZQUNELEtBQUssRUFBRTtnQkFDTCxLQUFLLEVBQUU7b0JBQ0wsc0JBQXNCLEVBQUUsSUFBSTtpQkFDN0I7Z0JBQ0QsTUFBTSxFQUFFLENBQUUseUJBQU8sQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLHlCQUFPLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBRTtnQkFDL0QsWUFBWSxFQUFFLFlBQVk7Z0JBQzFCLFVBQVUsRUFBRSxVQUFVO2FBQ3ZCO1NBRUYsQ0FBQyxDQUFDO1FBRUwsTUFBTSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUM7SUFFeEMsQ0FBQztDQUNGO0FBeENILDBCQXdDRyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcbmltcG9ydCB7IENka1N0YWNrIH0gZnJvbSAnLi4vbGliL2Nkay1zdGFjayc7XG5pbXBvcnQgeyBhd3NfY29nbml0byBhcyBjb2duaXRvIH0gZnJvbSAnYXdzLWNkay1saWInO1xuXG5cbmV4cG9ydCBjbGFzcyBDb2duaXRvIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wcz86IGNkay5TdGFja1Byb3BzKSB7XG4gICAgICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgICAgIGNvbnN0IGNsaWVudElkID0gJ2FlMGZlMTg1NDhiZTUyM2UzMmJlMTBhOWM1MDUwNGVkJztcbiAgICAgICAgY29uc3QgY2xpZW50U2VjcmV0ID0gJ2MzcVNPREJLR29mZnJXZVdDWmJNVmt5Y0ZZOWJNZ2owJztcbiAgICAgICAgY29uc3QgaXNzdWVyVXJsID0gJ2h0dHBzOi8va2F1dGgua2FrYW8uY29tJztcbiAgICAgICAgY29uc3QgY2FsbGJhY2tVcmxzID0gWydodHRwczovL2Rldi5kMjE5bmMwaXBiZWdjdy5hbXBsaWZ5YXBwLmNvbSddO1xuICAgICAgICBjb25zdCBsb2dvdXRVcmxzID0gWydodHRwczovL2Rldi5kMjE5bmMwaXBiZWdjdy5hbXBsaWZ5YXBwLmNvbSddO1xuXG4gICAgICAgIGNvbnN0IHVzZXJQb29sID0gbmV3IGNvZ25pdG8uVXNlclBvb2wodGhpcywgJ0NvZ25pdG9LYWthb1VzZXJQb29sJyk7XG5cbiAgICAgICAgY29uc3QgcHJvdmlkZXIgPSBuZXcgY29nbml0by5Vc2VyUG9vbElkZW50aXR5UHJvdmlkZXJPaWRjKHRoaXMsICdLYWthb1Byb3ZpZGVyJywge1xuICAgICAgICAgICAgY2xpZW50SWQ6IGNsaWVudElkLFxuICAgICAgICAgICAgY2xpZW50U2VjcmV0OiBjbGllbnRTZWNyZXQsXG4gICAgICAgICAgICBpc3N1ZXJVcmw6IGlzc3VlclVybCxcbiAgICAgICAgICAgIHVzZXJQb29sOiB1c2VyUG9vbCxcbiAgICAgICAgICAgIGF0dHJpYnV0ZVJlcXVlc3RNZXRob2Q6IGNvZ25pdG8uT2lkY0F0dHJpYnV0ZVJlcXVlc3RNZXRob2QuR0VULFxuICAgICAgICAgICAgbmFtZTogaXNzdWVyVXJsLFxuICAgICAgICAgICAgc2NvcGVzOiBbJ29wZW5pZCddXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IGNsaWVudCA9IHVzZXJQb29sLmFkZENsaWVudCgnYXBwQ2xpZW50Jywge1xuICAgICAgICAgICAgc3VwcG9ydGVkSWRlbnRpdHlQcm92aWRlcnM6IFtcbiAgICAgICAgICAgICAgICBjb2duaXRvLlVzZXJQb29sQ2xpZW50SWRlbnRpdHlQcm92aWRlci5jdXN0b21cbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBvQXV0aDoge1xuICAgICAgICAgICAgICBmbG93czoge1xuICAgICAgICAgICAgICAgIGF1dGhvcml6YXRpb25Db2RlR3JhbnQ6IHRydWUsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHNjb3BlczogWyBjb2duaXRvLk9BdXRoU2NvcGUuT1BFTklELCBjb2duaXRvLk9BdXRoU2NvcGUuRU1BSUwgXSxcbiAgICAgICAgICAgICAgY2FsbGJhY2tVcmxzOiBjYWxsYmFja1VybHMsXG4gICAgICAgICAgICAgIGxvZ291dFVybHM6IGxvZ291dFVybHMsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgY2xpZW50Lm5vZGUuYWRkRGVwZW5kZW5jeShwcm92aWRlcik7XG4gICAgICBcbiAgICB9XG4gIH0iXX0=