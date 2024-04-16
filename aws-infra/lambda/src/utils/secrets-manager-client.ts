import { SecretsManagerClient, GetSecretValueCommand, GetSecretValueResponse } from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient({
  region: process.env.REGION
});

export const getSecretValue = (secretId: string): Promise<GetSecretValueResponse> => {
  const command = new GetSecretValueCommand({
    SecretId: secretId
  });
  return client.send(command);
}
