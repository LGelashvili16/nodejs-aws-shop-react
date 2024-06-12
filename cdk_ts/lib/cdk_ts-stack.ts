import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3Deploy from "aws-cdk-lib/aws-s3-deployment";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as iam from "aws-cdk-lib/aws-iam";

export class CdkTsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create s3 bucket
    const myStoreBucket = new s3.Bucket(this, "MyStoreBucket", {
      bucketName: "cdk-lgelashvili-my-store-app",
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Create an OAI to allow CloudFront to access the S3 bucket
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(
      this,
      "OAI"
    );

    // Grant CloudFront access to the S3 bucket
    myStoreBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ["s3:GetObject"],
        resources: [myStoreBucket.arnForObjects("*")],
        principals: [
          new iam.CanonicalUserPrincipal(
            originAccessIdentity.cloudFrontOriginAccessIdentityS3CanonicalUserId
          ),
        ],
        effect: iam.Effect.ALLOW, // Allow access for the specified principal
      })
    );

    // Create CloudFront distribution
    const distribution = new cloudfront.Distribution(
      this,
      "MyStoreDistribution",
      {
        defaultBehavior: {
          origin: new origins.S3Origin(myStoreBucket, {
            originAccessIdentity: originAccessIdentity,
          }),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
        defaultRootObject: "index.html",
      }
    );

    // Deploy to S3 bucket
    const deployment = new s3Deploy.BucketDeployment(this, "DeployMyStore", {
      sources: [s3Deploy.Source.asset("../dist")],
      destinationBucket: myStoreBucket,
      distribution: distribution,
      distributionPaths: ["/*"],
    });

    // Invalidate cache in CloudFront after deployment
    deployment.node.addDependency(distribution);

    // Output the bucket website URL in Terminal
    new cdk.CfnOutput(this, "BucketWebsiteURL", {
      value: myStoreBucket.bucketWebsiteUrl,
    });

    // Output the CloudFront URL in Terminal
    new cdk.CfnOutput(this, "DistributionDomainName", {
      value: distribution.distributionDomainName,
    });
  }
}
