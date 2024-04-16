import { Duration, RemovalPolicy, Size, Stack, StackProps, Tags } from 'aws-cdk-lib';
import { AutoScalingGroup, HealthCheck, Schedule, ScheduledAction, Signals, UpdatePolicy } from 'aws-cdk-lib/aws-autoscaling';
import {
  CfnEIP,
  CloudFormationInit,
  EbsDeviceVolumeType,
  InitCommand,
  InitConfig,
  InitFile, InitService,
  InstanceClass,
  InstanceInitiatedShutdownBehavior,
  InstanceSize,
  InstanceType,
  IVpc,
  KeyPair,
  LaunchTemplate,
  MachineImage,
  Peer,
  Port,
  SecurityGroup, ServiceManager,
  SubnetType,
  UserData,
  Volume,
} from 'aws-cdk-lib/aws-ec2';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { IBucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { getEc2InstanceRole } from '../constructs/iam';
import { Configuration, ServerConfiguration } from '../types';

export interface ServerEc2StackProps extends StackProps {
  configuration: Configuration;
  serverConfiguration: ServerConfiguration;
  vpc: IVpc;
  configurationBucket: IBucket;
}

export class ServerEc2Stack extends Stack {

  // Public static IP Address
  public eip: CfnEIP;
  public dataVolume: Volume;
  private securityGroup: SecurityGroup;
  private launchTemplate: LaunchTemplate;
  public autoScalingGroup: AutoScalingGroup;

  private authLog: LogGroup;
  private launchLog: LogGroup;
  private cfnInitLog: LogGroup;
  private cloudwatchAgentLog: LogGroup;
  private sysLog: LogGroup;

  constructor(scope: Construct, id: string, props: ServerEc2StackProps) {
    super(scope, id, props);

    const {
      configuration,
      configurationBucket,
      vpc,
      serverConfiguration,
    } = props;

    const {
      amiName,
      sshIpAddressWhitelist,
      keyPairName,
    } = configuration;

    const {
      serverName,
      game,
      dataVolumeSizeGB,
      instanceClass,
      instanceSize,
      firewallOpenings,
      shutDownSchedule,
      startUpSchedule,
    } = serverConfiguration;

    const logginOptions = {
      removalPolicy: RemovalPolicy.DESTROY,
      retention: RetentionDays.TWO_WEEKS,
    };
    const logGroupNames = {
      authLog: `/ec2/${serverName}/auth-log`,
      launchLog: `/ec2/${serverName}/launch-log`,
      cfnInitLog: `/ec2/${serverName}/cfn-init-log`,
      cloudwatchAgentLog: `/ec2/${serverName}/cloudwatch-agent-log`,
      sysLog: `/ec2/${serverName}/sys-log`,
    };
    this.authLog = new LogGroup(this, 'AuthLog', {
      ...logginOptions,
      logGroupName: logGroupNames.authLog,
    });
    this.launchLog = new LogGroup(this, 'LaunchLog', {
      ...logginOptions,
      logGroupName: logGroupNames.launchLog,
    });
    this.cfnInitLog = new LogGroup(this, 'CfnInitLog', {
      ...logginOptions,
      logGroupName: logGroupNames.cfnInitLog,
    });
    this.cloudwatchAgentLog = new LogGroup(this, 'CloudWatchAgentLog', {
      ...logginOptions,
      logGroupName: logGroupNames.cloudwatchAgentLog,
    });
    this.sysLog = new LogGroup(this, 'SysLog', {
      ...logginOptions,
      logGroupName: logGroupNames.sysLog,
    });

    const INIT_BASE = '/opt/ec2/cfn-scripts'; // CFN-INIT resources location on the instance
    const LOCAL_CFN_INIT_FILES_BASE = `${__dirname}/cfn-init`;
    const LOCAL_GAME_FILES_PATH = `${__dirname}/../../../games/${game}`;
    const LOCAL_SERVER_FILES_PATH = `${__dirname}/../../../servers/${serverName}`;
    const SERVER_BASE_PATH = `/data/${serverName}`;

    const region = Stack.of(this).region;
    const stackId = Stack.of(this).stackId;
    const stackName = Stack.of(this).stackName;

    // Public static IP address
    this.eip = new CfnEIP(this, 'ElasticIp');

    // Persistent data volume mounted on the startup
    this.dataVolume = new Volume(this, 'DataVolume', {
      availabilityZone: `${region}a`,
      size: Size.gibibytes(dataVolumeSizeGB),
      encrypted: true,
      volumeType: EbsDeviceVolumeType.GP3,
      removalPolicy: RemovalPolicy.DESTROY,
    });
    Tags.of(this.dataVolume).add('Name', `${serverName}-data-volume`);

    // Firewall rules for the server
    this.securityGroup = new SecurityGroup(this, 'SecurityGroup', {
      vpc,
      description: 'SteamCMD EC2 Server Security Group',
      allowAllOutbound: true,
    });

    firewallOpenings.forEach(firewallOpening => {
      const { description, protocol, portNumber, sourceCIDR } = firewallOpening;
      const peer = sourceCIDR ? Peer.ipv4(sourceCIDR) : Peer.anyIpv4();
      const port = protocol === 'udp' ? Port.udp : Port.tcp;
      this.securityGroup.addIngressRule(
        peer,
        port(portNumber),
        description,
      );
    });

    // Allow SSH only from the whitelisted IP addresses
    sshIpAddressWhitelist.forEach(whiteListedIpAddress => {
      this.securityGroup.addIngressRule(
        Peer.ipv4(`${whiteListedIpAddress}/32`),
        Port.tcp(22),
      );
    });

    const userData = UserData.forLinux();
    userData.addCommands(
      'readonly LOG="/var/log/launch.log"',
      'touch $LOG',
      'exec 1>$LOG',
      'exec 2>&1',
      'set -xe',
      'set -o nounset',
      `echo "#### Launching ${serverName} instance ####"`,
      'apt-get update -y',
      'echo "##### USER DATA SCRIPT COMPLETED #####"',
      'echo "##### Proceeding with CFN-INIT... #####"',
    );
    const machineImage = MachineImage.lookup({ name: amiName });

    const keyPair = KeyPair.fromKeyPairName(this, 'KeyPair', keyPairName);

    const instanceRole = getEc2InstanceRole(this, 'InstanceRole', serverName);

    configurationBucket.grantRead(instanceRole);
    this.authLog.grantWrite(instanceRole);
    this.launchLog.grantWrite(instanceRole);
    this.cfnInitLog.grantWrite(instanceRole);
    this.cloudwatchAgentLog.grantWrite(instanceRole);
    this.sysLog.grantWrite(instanceRole);
    this.dataVolume.grantAttachVolume(instanceRole);
    this.dataVolume.grantDetachVolume(instanceRole);

    this.launchTemplate = new LaunchTemplate(this, 'LaunchTemplate', {
      machineImage,
      userData,
      associatePublicIpAddress: true,
      requireImdsv2: true,
      securityGroup: this.securityGroup,
      instanceInitiatedShutdownBehavior: InstanceInitiatedShutdownBehavior.TERMINATE,
      instanceType: InstanceType.of(instanceClass as InstanceClass, instanceSize as InstanceSize),
      keyPair,
      role: instanceRole,
    });

    this.autoScalingGroup = new AutoScalingGroup(this, 'AutoScalingGroup', {
      vpc,
      launchTemplate: this.launchTemplate,
      cooldown: Duration.minutes(1),
      healthCheck: HealthCheck.ec2({ grace: Duration.minutes(20) }),
      maxCapacity: 1,
      minCapacity: 0,
      vpcSubnets: {
        availabilityZones: [`${region}a`],
        subnetType: SubnetType.PUBLIC,
      },
      signals: Signals.waitForAll({ minSuccessPercentage: 0, timeout: Duration.minutes(20) }),
      updatePolicy: UpdatePolicy.rollingUpdate({}),
    });
    userData.addSignalOnExitCommand(this.autoScalingGroup);
    Tags.of(this.autoScalingGroup).add('autoscaling-group', serverName);
    Tags.of(this.autoScalingGroup).add('server-name', serverName);
    Tags.of(this.autoScalingGroup).add('steamec2-service', 'game-server');

    if (shutDownSchedule) {
      new ScheduledAction(this, 'ShutDownScheduledAction', {
        autoScalingGroup: this.autoScalingGroup,
        desiredCapacity: 0,
        schedule: Schedule.cron(shutDownSchedule),
      });
    }

    if (startUpSchedule) {
      new ScheduledAction(this, 'StartUpScheduledAction', {
        autoScalingGroup: this.autoScalingGroup,
        desiredCapacity: 1,
        schedule: Schedule.cron(startUpSchedule),
      });
    }

    const cfnInit = CloudFormationInit.fromConfigSets({
      configSets: {
        cloudInit: [
          'cloudInit',
          'configureCloudwatchAgent',
          'restartCloudwatchAgent',
          'steamCmdInit',
          'launchGame',
        ],
      },
      configs: {
        cloudInit: new InitConfig([
          // Use this to pass CDK-level properties to the EC2 instance. Can be parsed with jq
          InitFile.fromObject(
            `${INIT_BASE}/aws-props.json`,
            {
              eipAllocationId: this.eip.attrAllocationId,
              region: region,
              stackName: stackName,
              stackId: stackId,
              instanceName: serverName,
              dataVolume: true,
            },
            {
              group: 'root',
              owner: 'root',
              mode: '000644',
            },
          ),
          InitFile.fromFileInline(`${INIT_BASE}/cloud-init.sh`, `${LOCAL_CFN_INIT_FILES_BASE}/cloud-init.sh`, {
            group: 'root',
            owner: 'root',
            mode: '000700',
          }),
          InitFile.fromFileInline('/etc/motd', `${LOCAL_CFN_INIT_FILES_BASE}/banner.txt`, {
            group: 'root',
            owner: 'root',
            mode: '000644',
            base64Encoded: true,
          }),
          InitFile.fromFileInline(`${INIT_BASE}/sshd-config-additions.txt`, `${LOCAL_CFN_INIT_FILES_BASE}/sshd-config-additions.txt`, {
            group: 'root',
            owner: 'root',
            mode: '000600',
          }),
          // Commands
          InitCommand.shellCommand(`${INIT_BASE}/cloud-init.sh`, { key: '01-cloud-init' }),
        ]),
        configureCloudwatchAgent: new InitConfig([
          // InitFile.fromObject converts base JSON types to strings, to avoid this use base64-encoded string
          // Don't use CDK references here as they may not be properly resolved!
          InitFile.fromString(
            '/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json',
            Buffer.from(
              JSON.stringify(
                {
                  agent: {
                    metrics_collection_interval: 60,
                    region: region,
                    debug: false,
                  },
                  metrics: {
                    namespace: `${serverName}`,
                    metrics_collected: {
                      cpu: {
                        totalcpu: true,
                        measurement: ['cpu_usage_user', 'cpu_usage_system', 'cpu_usage_idle'],
                        metrics_collection_interval: 10,
                      },
                      disk: {
                        resources: ['/'],
                        measurement: ['used', 'total', 'free', 'used_percent'],
                      },
                      mem: {
                        measurement: ['used', 'total', 'free', 'cached', 'used_percent'],
                        metrics_collection_interval: 10,
                      },
                    },
                  },
                  logs: {
                    logs_collected: {
                      files: {
                        collect_list: [
                          {
                            file_path: '/var/log/auth.*',
                            log_group_name: logGroupNames.authLog,
                            timestamp_format: '%b %d %H:%M:%S',
                          },
                          {
                            file_path: '/var/log/cfn-init.*',
                            log_group_name: logGroupNames.cfnInitLog,
                            timestamp_format: '%Y-%m-%d %H:%M:%S,%f',
                            multi_line_start_pattern: '{timestamp_format}',
                          },
                          {
                            file_path: '/opt/aws/amazon-cloudwatch-agent/logs/amazon-cloudwatch-agent.*',
                            log_group_name: logGroupNames.cloudwatchAgentLog,
                            timestamp_format: '%Y-%m-%dT%H:%M:%SZ',
                            multi_line_start_pattern: '{timestamp_format}',
                          },
                          {
                            file_path: '/var/log/syslog*',
                            log_group_name: logGroupNames.sysLog,
                            timestamp_format: '%b %d %H:%M:%S',
                          },
                          {
                            file_path: '/var/log/launch.log',
                            log_group_name: logGroupNames.launchLog,
                          },
                        ],
                      },
                    },
                  },
                },
                null,
                2,
              ),
              'utf-8',
            ).toString('base64'),
            {
              group: 'root',
              owner: 'root',
              mode: '000644',
              base64Encoded: true,
            },
          ),
        ]),
        restartCloudwatchAgent: new InitConfig([
          InitCommand.shellCommand('/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a stop', {
            key: '01-stop-cwagent',
          }),
          InitCommand.shellCommand(
            '/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -s -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json',
            { key: '02-start-cwagent' },
          ),
        ]),
        steamCmdInit: new InitConfig([
          InitCommand.shellCommand(`mkdir -p /data/${serverName} && chown -R ubuntu:ubuntu /data/${serverName}`, {
            key: '01-server-directory',
          }),
          InitFile.fromFileInline(`${SERVER_BASE_PATH}/steamcmd-init.py`, `${LOCAL_CFN_INIT_FILES_BASE}/steamcmd-init.py`, {
            group: 'ubuntu',
            owner: 'ubuntu',
            mode: '000744',
          }),
          InitFile.fromFileInline(`${SERVER_BASE_PATH}/steamcmd.config.json`, `${LOCAL_SERVER_FILES_PATH}/steamcmd.config.json`, {
            group: 'ubuntu',
            owner: 'ubuntu',
            mode: '000744',
          }),
          InitCommand.shellCommand(`mkdir -p /data/${serverName}/workshop && chown -R ubuntu:ubuntu /data/${serverName}/workshop`, {
            key: '02-steam-workshop-directory',
          }),
          InitCommand.shellCommand(`mkdir -p /data/${serverName}/${game} && chown -R ubuntu:ubuntu /data/${serverName}/${game}`, {
            key: '03-game-install-directory',
          }),
          InitCommand.shellCommand(`runuser -u ubuntu -- /data/${serverName}/steamcmd-init.py ${serverName} ${game} ${configurationBucket.bucketName}`, {
            key: '04-steam-cmd-init',
          }),
        ]),
        launchGame: new InitConfig([
          InitFile.fromFileInline(`${SERVER_BASE_PATH}/launch-game.py`, `${LOCAL_GAME_FILES_PATH}/launch-game.py`, {
            group: 'ubuntu',
            owner: 'ubuntu',
            mode: '000744',
          }),
          InitFile.fromFileInline(`${SERVER_BASE_PATH}/default.config.json`, `${LOCAL_GAME_FILES_PATH}/default.config.json`, {
            group: 'ubuntu',
            owner: 'ubuntu',
            mode: '000744',
          }),
          InitFile.fromFileInline(`${SERVER_BASE_PATH}/${game}.config.json`, `${LOCAL_SERVER_FILES_PATH}/${game}.config.json`, {
            group: 'ubuntu',
            owner: 'ubuntu',
            mode: '000744',
          }),
          InitFile.fromFileInline(`${SERVER_BASE_PATH}/default.arguments.json`, `${LOCAL_GAME_FILES_PATH}/default.arguments.json`, {
            group: 'ubuntu',
            owner: 'ubuntu',
            mode: '000744',
          }),
          InitFile.fromFileInline(`${SERVER_BASE_PATH}/${game}.arguments.json`, `${LOCAL_SERVER_FILES_PATH}/${game}.arguments.json`, {
            group: 'ubuntu',
            owner: 'ubuntu',
            mode: '000744',
          }),
          InitService.systemdConfigFile('steamcmd-server', {
            command: `/data/${serverName}/launch-game.py ${serverName} ${game} ${configurationBucket.bucketName}`,
            cwd: `/data/${serverName}/${game}`,
            user: 'ubuntu',
            description: `${game}-service`,
          }),
          // Start the server using SystemD
          InitService.enable('steamcmd-server', {
            serviceManager: ServiceManager.SYSTEMD,
          }),
        ]),
      },
    });

    this.autoScalingGroup.applyCloudFormationInit(cfnInit, {
      configSets: ['cloudInit'],
    });
  }
}
