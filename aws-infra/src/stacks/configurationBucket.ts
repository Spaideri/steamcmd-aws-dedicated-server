import path from 'node:path';
import { Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { BlockPublicAccess, Bucket, BucketEncryption, EventType, IBucket } from 'aws-cdk-lib/aws-s3';
import { LambdaDestination } from 'aws-cdk-lib/aws-s3-notifications';
import { Construct } from 'constructs';
import { getSsmCommandExecutorManagedPolicy } from '../constructs/iam';
import { Configuration } from '../types';

export interface ConfigurationBucketStackProps extends StackProps {
  configuration: Configuration;
}
export class ConfigurationBucketStack extends Stack {

  public readonly bucket: IBucket;

  public readonly s3ConfigurationUpdatesLambda: NodejsFunction;

  constructor(scope: Construct, id: string, props: ConfigurationBucketStackProps) {
    super(scope, id, props);

    const { configuration } = props;
    const { region } = configuration;

    this.bucket = new Bucket(this, 'ConfigurationBucket', {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      encryption: BucketEncryption.S3_MANAGED,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    this.exportValue(this.bucket.bucketArn);
    this.exportValue(this.bucket.bucketName);

    this.s3ConfigurationUpdatesLambda = new NodejsFunction(this, 'S3ConfigurationUpdates', {
      architecture: Architecture.ARM_64,
      environment: {
        REGION: region,
      },
      memorySize: 512,
      depsLockFilePath: path.join(__dirname, '../../lambda/package-lock.json'),
      entry: path.join(__dirname, '../../lambda/src/s3-config-updates.ts'),
      logRetention: RetentionDays.TWO_WEEKS,
      description: 'Restart game server SystemD service when config files are updated in the s3 bucket',
      timeout: Duration.seconds(10),
      runtime: Runtime.NODEJS_20_X,
    });

    const ssmCommandExecutorPolicy = getSsmCommandExecutorManagedPolicy(this, 'SsmCommandExecutorManagedPolicy');
    const s3ConfigurationUpdatesRole = this.s3ConfigurationUpdatesLambda.role;
    if (s3ConfigurationUpdatesRole) {
      s3ConfigurationUpdatesRole.addManagedPolicy(ssmCommandExecutorPolicy);
    }
    this.bucket.addEventNotification(EventType.OBJECT_CREATED_PUT, new LambdaDestination(this.s3ConfigurationUpdatesLambda));
  }
}
