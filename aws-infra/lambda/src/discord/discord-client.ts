import axios, { AxiosError } from 'axios'
import { IDiscordEndpointInfo, IDiscordResponseData } from './types'

export const sendFollowupMessage = (
  endpointInfo: IDiscordEndpointInfo,
  interactionToken: string,
  responseData: IDiscordResponseData
): Promise<any> => {
  const { allowedMentions, ...strippedResponseData} = responseData;
  const authConfig = {
    headers: {
      'Authorization': `Bot ${endpointInfo.botToken}`,
    },
  };
  const data = {
    ...strippedResponseData,
    allowed_mentions: allowedMentions,
  };

  console.log('data', JSON.stringify(data))

  const url = `https://discord.com/api/v${
    endpointInfo.apiVersion ?? '10'
  }/webhooks/${endpointInfo.applicationId}/${interactionToken}`;

  return axios.post(url, data, authConfig)
    .catch((e: AxiosError) => {
      console.error(e.message, JSON.stringify(e.response.data))
    });
}