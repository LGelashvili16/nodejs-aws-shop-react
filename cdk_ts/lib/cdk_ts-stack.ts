/* eslint-disable prettier/prettier */
// import * as cdk from "@aws-cdk/core";
// import * as s3 from "@aws-cdk/aws-s3";
// import * as s3Deployment from "@aws-cdk/aws-s3-deployment";
// import * as cloudfront from "@aws-cdk/aws-cloudfront";
// import * as origins from "@aws-cdk/aws-cloudfront-origins";
// import * as iam from "@aws-cdk/aws-iam";

import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3Deployment from "aws-cdk-lib/aws-s3-deployment";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";

export class CdkTsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create s3 bucket
    const myStoreBucket = new s3.Bucket(this, "MyStoreBucket", {
      // bucketName: "cdk-my-store",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      // autoDeleteObjects: true,
      publicReadAccess: true,
      websiteIndexDocument: "index.html",
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
    });

    // Create CloudFront OAI
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(
      this,
      "OAI"
    );

    // Grant CloudFront access to the S3 bucker
    myStoreBucket.grantRead(originAccessIdentity);

    // Create CloudFront distribution
    const distribution = new cloudfront.Distribution(
      this,
      "MyStoreDistribution",
      {
        defaultRootObject: "index.html",
        defaultBehavior: {
          origin: new origins.S3Origin(myStoreBucket, {
            originAccessIdentity: originAccessIdentity,
          }),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
      }
    );

    // Deploy to S3 bucket
    new s3Deployment.BucketDeployment(this, "DeployMyStore", {
      sources: [s3Deployment.Source.asset("../dist")],
      destinationBucket: myStoreBucket,
      distribution: distribution,
      distributionPaths: ["/*"],
    });

    // Output the CloudFront URL
    new cdk.CfnOutput(this, "DistributionDomainName", {
      value: distribution.distributionDomainName,
    });
  }
}
