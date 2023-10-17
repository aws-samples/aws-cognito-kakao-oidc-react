"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CdkStack = void 0;
const cdk = require("aws-cdk-lib");
const apigw = require("aws-cdk-lib/aws-apigateway");
const lambda = require("aws-cdk-lib/aws-lambda");
const cognito_kakao_1 = require("./cognito-kakao");
class CdkStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const quotesFunction = new lambda.Function(this, "QuotesFunction", {
            runtime: lambda.Runtime.NODEJS_18_X,
            code: lambda.Code.fromAsset("lambda"),
            handler: "app.lambdaHandler",
        });
        const cognito = new cognito_kakao_1.CognitoKakao(this, "CognitoKakao");
        const authorizer = new apigw.CognitoUserPoolsAuthorizer(this, 'cognitoKakaoAuthorizer', {
            cognitoUserPools: [cognito.userPool]
        });
        const quotesApi = new apigw.RestApi(this, "QuotesApi", {
        // defaultMethodOptions: {
        //   authorizer: authorizer
        // }
        });
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
exports.CdkStack = CdkStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2RrLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY2RrLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLG1DQUFtQztBQUVuQyxvREFBb0Q7QUFDcEQsaURBQWlEO0FBQ2pELG1EQUErQztBQUcvQyxNQUFhLFFBQVMsU0FBUSxHQUFHLENBQUMsS0FBSztJQUNyQyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXNCO1FBQzlELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLE1BQU0sY0FBYyxHQUFHLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsZ0JBQWdCLEVBQUU7WUFDakUsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVztZQUNuQyxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDO1lBQ3JDLE9BQU8sRUFBRSxtQkFBbUI7U0FDN0IsQ0FBQyxDQUFDO1FBRUgsTUFBTSxPQUFPLEdBQUcsSUFBSSw0QkFBWSxDQUFDLElBQUksRUFBRSxjQUFjLENBQUMsQ0FBQztRQUV2RCxNQUFNLFVBQVUsR0FBRyxJQUFJLEtBQUssQ0FBQywwQkFBMEIsQ0FBQyxJQUFJLEVBQUUsd0JBQXdCLEVBQUU7WUFDdEYsZ0JBQWdCLEVBQUUsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDO1NBQ3JDLENBQUMsQ0FBQztRQUVILE1BQU0sU0FBUyxHQUFFLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsV0FBVyxFQUFFO1FBQ3BELDBCQUEwQjtRQUMxQiwyQkFBMkI7UUFDM0IsSUFBSTtTQUNMLENBQUMsQ0FBQztRQUVILE1BQU0sY0FBYyxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzNELGNBQWMsQ0FBQyxnQkFBZ0IsQ0FBQztZQUM5QixZQUFZLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxXQUFXO1lBQ3BDLFlBQVksRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLFdBQVc7U0FDckMsQ0FBQyxDQUFDO1FBRUgsY0FBYyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxLQUFLLENBQUMsaUJBQWlCLENBQUMsY0FBYyxDQUFDLEVBQUU7WUFDM0UsVUFBVSxFQUFFLFVBQVU7WUFDdEIsaUJBQWlCLEVBQUUsS0FBSyxDQUFDLGlCQUFpQixDQUFDLE9BQU87U0FDbkQsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBakNELDRCQWlDQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcbmltcG9ydCAqIGFzIGFwaWd3IGZyb20gJ2F3cy1jZGstbGliL2F3cy1hcGlnYXRld2F5JztcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWxhbWJkYVwiO1xuaW1wb3J0IHsgQ29nbml0b0tha2FvIH0gZnJvbSAnLi9jb2duaXRvLWtha2FvJztcblxuXG5leHBvcnQgY2xhc3MgQ2RrU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wcz86IGNkay5TdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICBjb25zdCBxdW90ZXNGdW5jdGlvbiA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgXCJRdW90ZXNGdW5jdGlvblwiLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMThfWCxcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldChcImxhbWJkYVwiKSxcbiAgICAgIGhhbmRsZXI6IFwiYXBwLmxhbWJkYUhhbmRsZXJcIixcbiAgICB9KTtcbiAgICBcbiAgICBjb25zdCBjb2duaXRvID0gbmV3IENvZ25pdG9LYWthbyh0aGlzLCBcIkNvZ25pdG9LYWthb1wiKTtcbiAgICBcbiAgICBjb25zdCBhdXRob3JpemVyID0gbmV3IGFwaWd3LkNvZ25pdG9Vc2VyUG9vbHNBdXRob3JpemVyKHRoaXMsICdjb2duaXRvS2FrYW9BdXRob3JpemVyJywge1xuICAgICAgY29nbml0b1VzZXJQb29sczogW2NvZ25pdG8udXNlclBvb2xdXG4gICAgfSk7XG5cbiAgICBjb25zdCBxdW90ZXNBcGkgPW5ldyBhcGlndy5SZXN0QXBpKHRoaXMsIFwiUXVvdGVzQXBpXCIsIHtcbiAgICAgIC8vIGRlZmF1bHRNZXRob2RPcHRpb25zOiB7XG4gICAgICAvLyAgIGF1dGhvcml6ZXI6IGF1dGhvcml6ZXJcbiAgICAgIC8vIH1cbiAgICB9KTtcblxuICAgIGNvbnN0IHF1b3Rlc1Jlc291cmNlID0gcXVvdGVzQXBpLnJvb3QuYWRkUmVzb3VyY2UoXCJxdW90ZVwiKTtcbiAgICBxdW90ZXNSZXNvdXJjZS5hZGRDb3JzUHJlZmxpZ2h0KHtcbiAgICAgIGFsbG93T3JpZ2luczogYXBpZ3cuQ29ycy5BTExfT1JJR0lOUyxcbiAgICAgIGFsbG93TWV0aG9kczogYXBpZ3cuQ29ycy5BTExfTUVUSE9EU1xuICAgIH0pO1xuICAgIFxuICAgIHF1b3Rlc1Jlc291cmNlLmFkZE1ldGhvZChcIkdFVFwiLCBuZXcgYXBpZ3cuTGFtYmRhSW50ZWdyYXRpb24ocXVvdGVzRnVuY3Rpb24pLCB7XG4gICAgICBhdXRob3JpemVyOiBhdXRob3JpemVyLFxuICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWd3LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE9cbiAgICB9KTtcbiAgfVxufVxuIl19