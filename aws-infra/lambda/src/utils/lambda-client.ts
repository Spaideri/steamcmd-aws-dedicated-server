import { InvokeCommand, InvokeCommandOutput, LambdaClient, LogType } from '@aws-sdk/client-lambda';

const client = new LambdaClient({
  region: process.env.REGION
});

export const invokeLambda = (functionName: string, payload: any): Promise<InvokeCommandOutput> => {
  const command = new InvokeCommand({
    FunctionName: functionName,
    Payload: JSON.stringify(payload),
    InvocationType: 'Event'
  });
  return client.send(command);
}
