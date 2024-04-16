import path from 'node:path';
import { Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Cors, LambdaIntegration, LogGroupLogDestination, RequestValidator, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import { getDiscordAutoScalingHandlerPolicy } from '../constructs/iam';
import { Configuration } from '../types';

export interface DiscordApiStackProps extends StackProps {
  configuration: Configuration;
}

/**
 * Credit for many snippets: https://github.com/GEMISIS/discord-bot-cdk-construct
 */
export class DiscordApiStack extends Stack {

  public readonly discordHandlerLambda: NodejsFunction;
  public readonly discordAutoscalingLambda: NodejsFunction;

  public readonly discordRestApi: RestApi;

  public readonly discordAPISecrets: Secret;

  constructor (scope: Construct, id: string, props: DiscordApiStackProps) {
    super(scope, id, props);

    const { configuration } = props;

    this.discordAPISecrets = new Secret(this, 'discord-bot-api-key', {
      secretName: 'discord-bot-secrets',
    });

    this.discordAutoscalingLambda = new NodejsFunction(this, 'DiscordAutoscalingLambda', {
      architecture: Architecture.ARM_64,
      environment: {
        REGION: configuration.region,
        DISCORD_BOT_SECRETS_NAME: this.discordAPISecrets.secretName,
      },
      memorySize: 512,
      depsLockFilePath: path.join(__dirname, '../../lambda/package-lock.json'),
      entry: path.join(__dirname, '../../lambda/src/discord/autoscaling-handler.ts'),
      logRetention: RetentionDays.TWO_WEEKS,
      description: 'Discord autoscaling handler',
      timeout: Duration.seconds(300),
      runtime: Runtime.NODEJS_20_X,
    });

    const autoScalingHandlerPolicy = getDiscordAutoScalingHandlerPolicy(this, 'DiscordAutoscalingLambdaPolicy');

    this.discordAutoscalingLambda.role?.attachInlinePolicy(autoScalingHandlerPolicy);

    this.discordHandlerLambda = new NodejsFunction(this, 'DiscordHandler', {
      architecture: Architecture.ARM_64,
      environment: {
        REGION: configuration.region,
        DISCORD_BOT_SECRETS_NAME: this.discordAPISecrets.secretName,
        DISCORD_AUTOSCALING_LAMBDA_ARN: this.discordAutoscalingLambda.functionArn,
      },
      memorySize: 512,
      depsLockFilePath: path.join(__dirname, '../../lambda/package-lock.json'),
      entry: path.join(__dirname, '../../lambda/src/discord/discord-handler.ts'),
      logRetention: RetentionDays.TWO_WEEKS,
      description: 'Discord interactions handler',
      timeout: Duration.seconds(3),
      runtime: Runtime.NODEJS_20_X,
    });

    this.discordAPISecrets.grantRead(this.discordHandlerLambda);
    this.discordAPISecrets.grantRead(this.discordAutoscalingLambda);
    this.discordAutoscalingLambda.grantInvoke(this.discordHandlerLambda);

    this.discordAPISecrets.grantRead(this.discordHandlerLambda);

    const discordApiAccessLogGroup = new LogGroup(this, 'AccessLogs', {
      logGroupName: '/api-gateway/discord-api/access-logs',
      removalPolicy: RemovalPolicy.DESTROY,
      retention: RetentionDays.TWO_WEEKS,
    });

    this.discordRestApi = new RestApi(this, 'DiscordRestApi', {
      restApiName: 'steamcmd-discord-api',
      description: 'Backend API for the Discrod bot',
      deployOptions: {
        accessLogDestination: new LogGroupLogDestination(discordApiAccessLogGroup),
      },
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
      },
    });

    const discordBotAPIValidator = new RequestValidator(this, 'DiscordBotApiValidator', {
      restApi: this.discordRestApi,
      validateRequestBody: true,
      validateRequestParameters: true,
    });

    // User authentication endpoint configuration
    const discordBotEventItems = this.discordRestApi.root.addResource('event', {
      defaultCorsPreflightOptions: {
        allowOrigins: [
          '*',
        ],
      },
    });

    // Transform our requests and responses as appropriate.
    const discordBotIntegration: LambdaIntegration = new LambdaIntegration(this.discordHandlerLambda, {
      proxy: false,
      requestTemplates: {
        'application/json': '{\r\n\
              "timestamp": "$input.params(\'x-signature-timestamp\')",\r\n\
              "signature": "$input.params(\'x-signature-ed25519\')",\r\n\
              "jsonBody" : $input.json(\'$\')\r\n\
            }',
      },
      integrationResponses: [
        {
          statusCode: '200',
        },
        {
          statusCode: '401',
          selectionPattern: '.*[UNAUTHORIZED].*',
          responseTemplates: {
            'application/json': 'invalid request signature',
          },
        },
      ],
    });

    // Add a POST method for the Discord APIs.
    discordBotEventItems.addMethod('POST', discordBotIntegration, {
      apiKeyRequired: false,
      requestValidator: discordBotAPIValidator,
      methodResponses: [
        {
          statusCode: '200',
        },
        {
          statusCode: '401',
        },
      ],
    });
  }
}