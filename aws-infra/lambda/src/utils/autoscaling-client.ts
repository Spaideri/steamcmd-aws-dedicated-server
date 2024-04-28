import {
  AutoScalingClient,
  AutoScalingGroup,
  DescribeAutoScalingGroupsCommand,
  TerminateInstanceInAutoScalingGroupCommand,
  TerminateInstanceInAutoScalingGroupCommandOutput,
  UpdateAutoScalingGroupCommand,
  UpdateAutoScalingGroupCommandOutput
} from '@aws-sdk/client-auto-scaling'

const client = new AutoScalingClient({
  region: process.env.REGION
});

export const findAutoscalingGroupByServerName = async (serverName: string): Promise<AutoScalingGroup> => {
  const input = { // AutoScalingGroupNamesType
    Filters: [
      {
        Name: 'tag:server-name',
        Values: [serverName]
      }
    ],
  };

  const command = new DescribeAutoScalingGroupsCommand(input)
  const result = await client.send(command);
  const autoScalingGroupName = result.AutoScalingGroups?.[0].AutoScalingGroupName
  if (!autoScalingGroupName) {
    throw new Error(`No auto scaling group fround with server name ${serverName}`)
  }
  return result.AutoScalingGroups[0]
}

export const terminateInstanceById = async (instanceId: string): Promise<TerminateInstanceInAutoScalingGroupCommandOutput> => {
  const input = {
    InstanceId: instanceId,
    ShouldDecrementDesiredCapacity: false
  }
  return client.send(new TerminateInstanceInAutoScalingGroupCommand(input))
}

export const updateDesiredCapacity = async (autoScalingGroupName: string, desiredCapacity: number): Promise<UpdateAutoScalingGroupCommandOutput> => {
  const input = {
    AutoScalingGroupName: autoScalingGroupName,
    DesiredCapacity: desiredCapacity,
    NewInstancesProtectedFromScaleIn: false,
    MinSize: 0,
    MaxSize: 1
  };

  const command = new UpdateAutoScalingGroupCommand(input)
  return client.send(command);
}
