import { Stack } from 'aws-cdk-lib';
import {
  Effect,
  ManagedPolicy, Policy,
  PolicyDocument,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export const getEc2InstanceRole = (scope: Construct, id: string, serverName: string): Role => {
  const ssmEc2DefaultPolicy = ManagedPolicy.fromManagedPolicyArn(
    scope,
    'SsmEc2ManagedPolicy',
    'arn:aws:iam::aws:policy/AmazonSSMManagedEC2InstanceDefaultPolicy',
  );
  return new Role(scope, id, {
    assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
    managedPolicies: [ssmEc2DefaultPolicy],
    inlinePolicies: {
      instancePolicy: new PolicyDocument({
        statements: [
          new PolicyStatement({
            sid: 'EipAssociation',
            effect: Effect.ALLOW,
            actions: ['ec2:DescribeAddresses', 'ec2:AllocateAddress', 'ec2:DescribeInstances', 'ec2:AssociateAddress'],
            resources: ['*'],
          }),
          new PolicyStatement({
            sid: 'DescribeVolumes',
            effect: Effect.ALLOW,
            actions: ['ec2:DescribeVolumes'],
            resources: ['*'],
          }),
          // TODO: Do we need CreateSnapshot?
          new PolicyStatement({
            sid: 'EC2VolumeOps',
            effect: Effect.ALLOW,
            actions: ['ec2:AttachVolume', 'ec2:CreateSnapshot'],
            resources: [
              Stack.of(scope).formatArn({
                service: 'ec2',
                resource: 'volume',
                resourceName: '*',
              }),
            ],
            conditions: {
              StringLike: {
                'ec2:ResourceTag/name': `${serverName}-*`,
              },
            },
          }),
          new PolicyStatement({
            sid: 'CloudWatchMetrics',
            effect: Effect.ALLOW,
            actions: ['cloudwatch:PutMetricData'],
            resources: ['*'],
          }),
          new PolicyStatement({
            sid: 'CfnInit',
            actions: ['cloudformation:DescribeStackResource', 'cloudformation:SignalResource'],
            effect: Effect.ALLOW,
            resources: ['*'],
          }),
        ],
      }),
    },
  });
};

export const getSsmCommandExecutorManagedPolicy = (scope: Construct, id: string): ManagedPolicy => {
  return new ManagedPolicy(scope, id, {
    description: 'Policy to allow executing SSM run command on the game server instances',
    statements: [
      new PolicyStatement({
        sid: 'UseDocument',
        effect: Effect.ALLOW,
        actions: [
          'ssm:SendCommand',
        ],
        resources: ['arn:aws:ssm:*::document/AWS-RunShellScript'],
      }),
      new PolicyStatement({
        sid: 'SsmRunCommand',
        effect: Effect.ALLOW,
        actions: [
          'ssm:SendCommand',
        ],
        resources: ['arn:aws:ec2:*:*:instance/*'],
        conditions: {
          StringEquals: {
            'ssm:resourceTag/steamec2-service': 'game-server',
          },
        },
      }),
      new PolicyStatement({
        sid: 'FindEc2',
        effect: Effect.ALLOW,
        actions: [
          'ec2:DescribeInstances',
        ],
        resources: ['*'],
      }),
    ],
  });
};

export const getDiscordAutoScalingHandlerPolicy = (scope: Construct, id: string): Policy => {
  return new Policy(scope, id, {
    statements: [
      new PolicyStatement({
        sid: 'DescribeAutoscaling',
        effect: Effect.ALLOW,
        actions: ['autoscaling:DescribeAutoScalingGroups'],
        resources: ['*'],
      }),
      new PolicyStatement({
        sid: 'UpdateAutoscaling',
        effect: Effect.ALLOW,
        actions: [
          'autoscaling:UpdateAutoScalingGroup',
          'autoscaling:TerminateInstanceInAutoScalingGroup',
        ],
        resources: ['*'],
        conditions: {
          StringEquals: {
            'aws:ResourceTag/steamec2-service': 'game-server',
          },
        },
      }),
      new PolicyStatement({
        sid: 'FindEc2',
        effect: Effect.ALLOW,
        actions: [
          'ec2:DescribeInstances',
        ],
        resources: ['*'],
      }),
    ],
  });
};

export const getSysLogHandlerPolicy = (scope: Construct, id: string): Policy => {
  return new Policy(scope, id, {
    statements: [
      new PolicyStatement({
        sid: 'PutMetricsData',
        effect: Effect.ALLOW,
        actions: ['cloudwatch:putMetricData'],
        resources: ['*'],
      }),
    ],
  });
};