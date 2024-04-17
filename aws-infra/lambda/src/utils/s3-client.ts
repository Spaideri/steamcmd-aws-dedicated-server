import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand
} from '@aws-sdk/client-s3'

const BUCKET_NAME = process.env.CONFIGURATION_BUCKET_NAME;

const client = new S3Client({
  region: process.env.REGION
});

export const getServerConfigurationFile = async (serverName: string, configurationFileName: string): Promise<string> => {
  const input = { // GetObjectRequest
    Bucket: BUCKET_NAME,
    Key: `${serverName}/${configurationFileName}`, // required
  };

  const command = new GetObjectCommand(input)
  const response = await client.send(command);

  return await response.Body.transformToString('utf-8')
}

export const putServerConfigurationFile = async (serverName: string, configurationFileName: string, body: string): Promise<any> => {
  const input = {
    Body: body,
    Bucket: BUCKET_NAME,
    Key: `${serverName}/${configurationFileName}`,
  };
  const command = new PutObjectCommand(input);
  return client.send(command)
}
