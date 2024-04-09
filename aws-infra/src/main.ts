import { App } from 'aws-cdk-lib';
import { ConfigurationBucketStack } from './stacks/configurationBucket';
import { ServerEc2Stack } from './stacks/serverEc2';
import { VpcStack } from './stacks/vpc';
import { ConfigurationSchema } from './types';
import { parseConfiguration } from './utils/files';
import { LambdasStack } from './stacks/lambdas'

const configuration = parseConfiguration();
console.log('CONFIGURATION:', configuration);
const cdkEnv = {
  account: configuration.accountId,
  region: configuration.region,
};

// Validate parsed configuration using zod schema
ConfigurationSchema.parse(configuration);

const app = new App();

const vpcStack = new VpcStack(app, 'SteamCmdVpcStack', { env: cdkEnv });
const bucketStack = new ConfigurationBucketStack(app, 'SteamCmdConfigurationBucketStack', { env: cdkEnv });
new LambdasStack(app, 'SteamCmdLambdasStack', {
  env: cdkEnv,
  configuration,
  configurationBucket: bucketStack.bucket
});

configuration.servers.forEach(serverConfiguration => {
  new ServerEc2Stack(app, `SteamCmdServer-${serverConfiguration.serverName}`, {
    env: cdkEnv,
    configuration,
    serverConfiguration,
    vpc: vpcStack.vpc,
    configurationBucket: bucketStack.bucket,
  });
});

app.synth();
