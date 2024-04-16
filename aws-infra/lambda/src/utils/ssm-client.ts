import { SSMClient, SendCommandCommand, SendCommandResult } from "@aws-sdk/client-ssm";

const ssmClient = new SSMClient({
  region: process.env.REGION
})

export const restartGameServiceOnInstanceId = (instanceId: string): Promise<SendCommandResult> => {
  const input = {
    InstanceIds: [ instanceId ],
    TimeoutSeconds: Number(3600),
    Comment: 'Restart game SystemD service',
    DocumentName: 'AWS-RunShellScript',
    Parameters: {
      commands: [
        `sudo systemctl restart steamcmd-server.service && echo $?`,
      ],
    }
  };
  const command = new SendCommandCommand(input);
  return ssmClient.send(command);
}