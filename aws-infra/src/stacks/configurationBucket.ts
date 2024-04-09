import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { BlockPublicAccess, Bucket, BucketEncryption, IBucket } from 'aws-cdk-lib/aws-s3'
import { Construct } from 'constructs';

export class ConfigurationBucketStack extends Stack {

  public readonly bucket: IBucket;

  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);

    this.bucket = new Bucket(this, 'ConfigurationBucket', {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      encryption: BucketEncryption.S3_MANAGED,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    this.exportValue(this.bucket.bucketArn);
    this.exportValue(this.bucket.bucketName);
  }
}
