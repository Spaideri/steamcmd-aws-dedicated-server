import { Duration, Stack, StackProps } from 'aws-cdk-lib'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import { Construct } from 'constructs'
import { Configuration } from '../types'
import { EventType, IBucket } from 'aws-cdk-lib/aws-s3'
import path from 'node:path'
import { RetentionDays } from 'aws-cdk-lib/aws-logs'
import { LambdaDestination } from 'aws-cdk-lib/aws-s3-notifications'
import { getSsmCommandExecutorManagedPolicy } from '../constructs/iam'
import { Runtime } from 'aws-cdk-lib/aws-lambda'


export interface LambdasStackProps extends StackProps {
  configuration: Configuration;
  configurationBucket: IBucket;
}

export class LambdasStack extends Stack {

  public readonly s3ConfigurationUpdatesLambda: NodejsFunction;

  constructor (scope: Construct, id: string, props: LambdasStackProps) {
    super(scope, id, props);

    const { configuration, configurationBucket } = props
    const { region } = configuration;

    this.s3ConfigurationUpdatesLambda = new NodejsFunction(this, 's3ConfigurationUpdates', {
      environment: {
        REGION: region,
      },
      depsLockFilePath: path.join(__dirname, '../../lambda/package-lock.json'),
      entry: path.join(__dirname, '../../lambda/src/s3-config-updates.ts'),
      logRetention: RetentionDays.TWO_WEEKS,
      description: 'Restart game server SystemD service when config files are updated in the s3 bucket',
      timeout: Duration.seconds(10),
      runtime: Runtime.NODEJS_20_X
    })

    const ssmCommandExecutorPolicy = getSsmCommandExecutorManagedPolicy(this, 'SsmCommandExecutorManagedPolicy')
    const s3ConfigurationUpdatesRole = this.s3ConfigurationUpdatesLambda.role
    if (s3ConfigurationUpdatesRole) {
      s3ConfigurationUpdatesRole.addManagedPolicy(ssmCommandExecutorPolicy)
    }
    configurationBucket.addEventNotification(EventType.OBJECT_CREATED_PUT, new LambdaDestination(this.s3ConfigurationUpdatesLambda))
  }

}