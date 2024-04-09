import { EC2Client, DescribeInstancesCommand } from "@aws-sdk/client-ec2";

const ec2Client = new EC2Client({
  region: process.env.REGION
});

export const getRunningInstanceIdByServerName = async (serverName: string): Promise<string | null> => {
  const input = {
    Filters: [
      {
        Name: 'instance-state-name',
        Values: ['running']
      },
      {
        Name: 'tag:server-name',
        Values: [serverName]
      }
    ]
  }
  const command = new DescribeInstancesCommand(input);
  const result = await ec2Client.send(command);
  if (result.Reservations.length === 0) {
    console.log(`No running instances with server-name: ${serverName}`)
    return null;
  }
  const instanceId = result.Reservations[0].Instances?.[0].InstanceId
  console.log(`Found running instance: ${instanceId} with server-name: ${serverName}`)
  return instanceId
}
