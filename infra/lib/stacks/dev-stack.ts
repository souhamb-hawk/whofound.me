import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayv2Integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';
import * as path from 'path';

// Get the project root directory (infra is one level below project root)
const projectRoot = path.resolve(process.cwd(), '..');

/**
 * Development/Testing Stack
 * 
 * Simplified infrastructure for testing without custom domain:
 * - S3 bucket for static frontend
 * - Lambda function for search API
 * - API Gateway HTTP API
 * - CloudFront distribution (using default CloudFront domain)
 */
export class DevStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ============================================
    // S3 Bucket for Frontend Static Assets
    // ============================================
    const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // ============================================
    // Lambda Function for Search API
    // ============================================
    const searchFunction = new lambda.Function(this, 'SearchFunction', {
      functionName: 'whofoundme-dev-search',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handlers/search.handler',
      code: lambda.Code.fromAsset(path.join(projectRoot, 'backend/lambda-bundle')),
      memorySize: 256,
      timeout: cdk.Duration.seconds(30), // More timeout for dev
      architecture: lambda.Architecture.ARM_64,
      environment: {
        NODE_ENV: 'development',
      },
      logRetention: logs.RetentionDays.ONE_DAY,
    });

    // ============================================
    // API Gateway HTTP API
    // ============================================
    const httpApi = new apigatewayv2.HttpApi(this, 'HttpApi', {
      apiName: 'whofoundme-dev-api',
      description: 'whofound.me Dev Search API',
      corsPreflight: {
        allowOrigins: ['*'], // Allow all origins for dev
        allowMethods: [apigatewayv2.CorsHttpMethod.POST, apigatewayv2.CorsHttpMethod.OPTIONS],
        allowHeaders: ['Content-Type'],
        maxAge: cdk.Duration.hours(1),
      },
    });

    // Add search route
    httpApi.addRoutes({
      path: '/api/search',
      methods: [apigatewayv2.HttpMethod.POST],
      integration: new apigatewayv2Integrations.HttpLambdaIntegration(
        'SearchIntegration',
        searchFunction
      ),
    });

    // ============================================
    // CloudFront Distribution
    // ============================================
    
    const oac = new cloudfront.S3OriginAccessControl(this, 'OAC', {
      originAccessControlName: 'whofoundme-dev-oac',
    });

    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultRootObject: 'index.html',
      httpVersion: cloudfront.HttpVersion.HTTP2,
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(websiteBucket, {
          originAccessControl: oac,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED, // No caching for dev
      },
      
      additionalBehaviors: {
        '/api/*': {
          origin: new origins.HttpOrigin(
            `${httpApi.apiId}.execute-api.${this.region}.amazonaws.com`
          ),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        },
      },

      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(0),
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(0),
        },
      ],
    });

    // ============================================
    // Deploy Frontend Assets
    // ============================================
    new s3deploy.BucketDeployment(this, 'DeployFrontend', {
      sources: [s3deploy.Source.asset(path.join(projectRoot, 'frontend/dist'))],
      destinationBucket: websiteBucket,
      distribution,
      distributionPaths: ['/*'],
    });

    // ============================================
    // Outputs
    // ============================================
    new cdk.CfnOutput(this, 'WebsiteURL', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'CloudFront Website URL',
    });

    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: httpApi.apiEndpoint,
      description: 'API Gateway endpoint URL',
    });

    new cdk.CfnOutput(this, 'DistributionId', {
      value: distribution.distributionId,
      description: 'CloudFront distribution ID',
    });
  }
}

