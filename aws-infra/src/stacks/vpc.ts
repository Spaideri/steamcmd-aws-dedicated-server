import { Stack, StackProps } from 'aws-cdk-lib';
import { IpAddresses, IVpc, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export class VpcStack extends Stack {

  public readonly vpc: IVpc;
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);

    this.vpc = new Vpc(this, 'vpc', {
      ipAddresses: IpAddresses.cidr('100.0.0.0/24'),
      vpcName: 'SteamCmdVpc',
      natGateways: 0,
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 27,
          name: 'public-a',
          subnetType: SubnetType.PUBLIC,
        },
        {
          cidrMask: 27,
          name: 'public-b',
          subnetType: SubnetType.PUBLIC,
        },
      ],
    });
  }
}
