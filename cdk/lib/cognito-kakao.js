"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CognitoKakao = void 0;
const constructs_1 = require("constructs");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const fs = require("fs");
class CognitoKakao extends constructs_1.Construct {
    constructor(scope, id, props) {
        super(scope, id);
        const configFilePath = 'app.json';
        const configData = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
        const clientId = configData.clientId;
        const clientSecret = configData.clientSecret;
        const issuerUrl = configData.issuerUrl;
        const callbackUrls = [configData.callbackUrl];
        const logoutUrls = [configData.logoutUrl];
        // const clientId = 'ae0fe18548be523e32be10a9c50504ed';
        // const clientSecret = 'c3qSODBKGoffrWeWCZbMVkycFY9bMgj0';
        // const issuerUrl = 'https://kauth.kakao.com';
        // const callbackUrls = ['https://dev.d219nc0ipbegcw.amplifyapp.com'];
        // const logoutUrls = ['https://dev.d219nc0ipbegcw.amplifyapp.com'];
        this.userPool = new aws_cdk_lib_1.aws_cognito.UserPool(this, 'CognitoKakaoUserPool');
        this.userPool.addDomain('CognitoKakaoDomain', {
            cognitoDomain: { domainPrefix: 'kakao-oidc-a' }
        });
        const provider = new aws_cdk_lib_1.aws_cognito.UserPoolIdentityProviderOidc(this, 'KakaoProvider', {
            clientId: clientId,
            clientSecret: clientSecret,
            issuerUrl: issuerUrl,
            userPool: this.userPool,
            attributeRequestMethod: aws_cdk_lib_1.aws_cognito.OidcAttributeRequestMethod.GET,
            name: 'KakaoProvider',
            scopes: ['openid']
        });
        const client = this.userPool.addClient('appClient', {
            supportedIdentityProviders: [
                aws_cdk_lib_1.aws_cognito.UserPoolClientIdentityProvider.custom(provider.providerName)
            ],
            oAuth: {
                flows: {
                    authorizationCodeGrant: true
                },
                scopes: [aws_cdk_lib_1.aws_cognito.OAuthScope.OPENID, aws_cdk_lib_1.aws_cognito.OAuthScope.EMAIL],
                callbackUrls: callbackUrls,
                logoutUrls: logoutUrls,
            },
        });
        client.node.addDependency(provider);
    }
}
exports.CognitoKakao = CognitoKakao;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29nbml0by1rYWthby5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNvZ25pdG8ta2FrYW8udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EsMkNBQXVDO0FBQ3ZDLDZDQUFxRDtBQUNyRCx5QkFBeUI7QUFHekIsTUFBYSxZQUFhLFNBQVEsc0JBQVM7SUFJdkMsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFzQjtRQUM1RCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRWpCLE1BQU0sY0FBYyxHQUFHLFVBQVUsQ0FBQztRQUNsQyxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQUMsY0FBYyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFFdkUsTUFBTSxRQUFRLEdBQUcsVUFBVSxDQUFDLFFBQVEsQ0FBQztRQUNyQyxNQUFNLFlBQVksR0FBRyxVQUFVLENBQUMsWUFBWSxDQUFDO1FBQzdDLE1BQU0sU0FBUyxHQUFHLFVBQVUsQ0FBQyxTQUFTLENBQUM7UUFDdkMsTUFBTSxZQUFZLEdBQUcsQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDOUMsTUFBTSxVQUFVLEdBQUcsQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLENBQUM7UUFFMUMsdURBQXVEO1FBQ3ZELDJEQUEyRDtRQUMzRCwrQ0FBK0M7UUFDL0Msc0VBQXNFO1FBQ3RFLG9FQUFvRTtRQUVwRSxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUkseUJBQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLHNCQUFzQixDQUFDLENBQUM7UUFDbkUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsb0JBQW9CLEVBQUU7WUFDNUMsYUFBYSxFQUFFLEVBQUUsWUFBWSxFQUFFLGNBQWMsRUFBRTtTQUNoRCxDQUFDLENBQUM7UUFFSCxNQUFNLFFBQVEsR0FBRyxJQUFJLHlCQUFPLENBQUMsNEJBQTRCLENBQUMsSUFBSSxFQUFFLGVBQWUsRUFBRTtZQUM3RSxRQUFRLEVBQUUsUUFBUTtZQUNsQixZQUFZLEVBQUUsWUFBWTtZQUMxQixTQUFTLEVBQUUsU0FBUztZQUNwQixRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVE7WUFDdkIsc0JBQXNCLEVBQUUseUJBQU8sQ0FBQywwQkFBMEIsQ0FBQyxHQUFHO1lBQzlELElBQUksRUFBRSxlQUFlO1lBQ3JCLE1BQU0sRUFBRSxDQUFDLFFBQVEsQ0FBQztTQUNyQixDQUFDLENBQUM7UUFFSCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxXQUFXLEVBQUU7WUFDaEQsMEJBQTBCLEVBQUU7Z0JBQzFCLHlCQUFPLENBQUMsOEJBQThCLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUM7YUFDckU7WUFDRCxLQUFLLEVBQUU7Z0JBQ0wsS0FBSyxFQUFFO29CQUNMLHNCQUFzQixFQUFFLElBQUk7aUJBQzdCO2dCQUNELE1BQU0sRUFBRSxDQUFFLHlCQUFPLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSx5QkFBTyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUU7Z0JBQy9ELFlBQVksRUFBRSxZQUFZO2dCQUMxQixVQUFVLEVBQUUsVUFBVTthQUN2QjtTQUNGLENBQUMsQ0FBQztRQUVMLE1BQU0sQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ3hDLENBQUM7Q0FDRjtBQXJESCxvQ0FxREciLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5pbXBvcnQgeyBhd3NfY29nbml0byBhcyBjb2duaXRvIH0gZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xuXG5cbmV4cG9ydCBjbGFzcyBDb2duaXRvS2FrYW8gZXh0ZW5kcyBDb25zdHJ1Y3Qge1xuXG4gICAgcHVibGljIHJlYWRvbmx5IHVzZXJQb29sOiBjb2duaXRvLlVzZXJQb29sO1xuICAgIFxuICAgIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogY2RrLlN0YWNrUHJvcHMpIHtcbiAgICAgICAgc3VwZXIoc2NvcGUsIGlkKTtcblxuICAgICAgICBjb25zdCBjb25maWdGaWxlUGF0aCA9ICdhcHAuanNvbic7XG4gICAgICAgIGNvbnN0IGNvbmZpZ0RhdGEgPSBKU09OLnBhcnNlKGZzLnJlYWRGaWxlU3luYyhjb25maWdGaWxlUGF0aCwgJ3V0ZjgnKSk7XG4gICAgXG4gICAgICAgIGNvbnN0IGNsaWVudElkID0gY29uZmlnRGF0YS5jbGllbnRJZDtcbiAgICAgICAgY29uc3QgY2xpZW50U2VjcmV0ID0gY29uZmlnRGF0YS5jbGllbnRTZWNyZXQ7XG4gICAgICAgIGNvbnN0IGlzc3VlclVybCA9IGNvbmZpZ0RhdGEuaXNzdWVyVXJsO1xuICAgICAgICBjb25zdCBjYWxsYmFja1VybHMgPSBbY29uZmlnRGF0YS5jYWxsYmFja1VybF07XG4gICAgICAgIGNvbnN0IGxvZ291dFVybHMgPSBbY29uZmlnRGF0YS5sb2dvdXRVcmxdO1xuXG4gICAgICAgIC8vIGNvbnN0IGNsaWVudElkID0gJ2FlMGZlMTg1NDhiZTUyM2UzMmJlMTBhOWM1MDUwNGVkJztcbiAgICAgICAgLy8gY29uc3QgY2xpZW50U2VjcmV0ID0gJ2MzcVNPREJLR29mZnJXZVdDWmJNVmt5Y0ZZOWJNZ2owJztcbiAgICAgICAgLy8gY29uc3QgaXNzdWVyVXJsID0gJ2h0dHBzOi8va2F1dGgua2FrYW8uY29tJztcbiAgICAgICAgLy8gY29uc3QgY2FsbGJhY2tVcmxzID0gWydodHRwczovL2Rldi5kMjE5bmMwaXBiZWdjdy5hbXBsaWZ5YXBwLmNvbSddO1xuICAgICAgICAvLyBjb25zdCBsb2dvdXRVcmxzID0gWydodHRwczovL2Rldi5kMjE5bmMwaXBiZWdjdy5hbXBsaWZ5YXBwLmNvbSddO1xuXG4gICAgICAgIHRoaXMudXNlclBvb2wgPSBuZXcgY29nbml0by5Vc2VyUG9vbCh0aGlzLCAnQ29nbml0b0tha2FvVXNlclBvb2wnKTtcbiAgICAgICAgdGhpcy51c2VyUG9vbC5hZGREb21haW4oJ0NvZ25pdG9LYWthb0RvbWFpbicsIHtcbiAgICAgICAgICBjb2duaXRvRG9tYWluOiB7IGRvbWFpblByZWZpeDogJ2tha2FvLW9pZGMtYScgfVxuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBwcm92aWRlciA9IG5ldyBjb2duaXRvLlVzZXJQb29sSWRlbnRpdHlQcm92aWRlck9pZGModGhpcywgJ0tha2FvUHJvdmlkZXInLCB7XG4gICAgICAgICAgICBjbGllbnRJZDogY2xpZW50SWQsXG4gICAgICAgICAgICBjbGllbnRTZWNyZXQ6IGNsaWVudFNlY3JldCxcbiAgICAgICAgICAgIGlzc3VlclVybDogaXNzdWVyVXJsLFxuICAgICAgICAgICAgdXNlclBvb2w6IHRoaXMudXNlclBvb2wsXG4gICAgICAgICAgICBhdHRyaWJ1dGVSZXF1ZXN0TWV0aG9kOiBjb2duaXRvLk9pZGNBdHRyaWJ1dGVSZXF1ZXN0TWV0aG9kLkdFVCxcbiAgICAgICAgICAgIG5hbWU6ICdLYWthb1Byb3ZpZGVyJyxcbiAgICAgICAgICAgIHNjb3BlczogWydvcGVuaWQnXVxuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBjbGllbnQgPSB0aGlzLnVzZXJQb29sLmFkZENsaWVudCgnYXBwQ2xpZW50Jywge1xuICAgICAgICAgICAgc3VwcG9ydGVkSWRlbnRpdHlQcm92aWRlcnM6IFtcbiAgICAgICAgICAgICAgY29nbml0by5Vc2VyUG9vbENsaWVudElkZW50aXR5UHJvdmlkZXIuY3VzdG9tKHByb3ZpZGVyLnByb3ZpZGVyTmFtZSlcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBvQXV0aDoge1xuICAgICAgICAgICAgICBmbG93czoge1xuICAgICAgICAgICAgICAgIGF1dGhvcml6YXRpb25Db2RlR3JhbnQ6IHRydWVcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgc2NvcGVzOiBbIGNvZ25pdG8uT0F1dGhTY29wZS5PUEVOSUQsIGNvZ25pdG8uT0F1dGhTY29wZS5FTUFJTCBdLFxuICAgICAgICAgICAgICBjYWxsYmFja1VybHM6IGNhbGxiYWNrVXJscyxcbiAgICAgICAgICAgICAgbG9nb3V0VXJsczogbG9nb3V0VXJscyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgY2xpZW50Lm5vZGUuYWRkRGVwZW5kZW5jeShwcm92aWRlcik7XG4gICAgfVxuICB9Il19