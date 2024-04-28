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

  const url = `https://discord.com/api/v${
    endpointInfo.apiVersion ?? '10'
  }/webhooks/${endpointInfo.applicationId}/${interactionToken}`;

  return axios.post(url, data, authConfig)
    .catch((e: AxiosError) => {
      console.error(e.message, JSON.stringify(e.response.data))
    });
}

export const sendChannelMessage = (
  endpointInfo: IDiscordEndpointInfo,
  channelId: string,
  message: string
): Promise<any> => {
  const authConfig = {
    headers: {
      'Authorization': `Bot ${endpointInfo.botToken}`,
    },
  };
  const data = { content: message };

  const url = `https://discord.com/api/v${
    endpointInfo.apiVersion ?? '10'
  }/channels/${channelId}/messages`;

  return axios.post(url, data, authConfig)
    .catch((e: AxiosError) => {
      console.error(e.message, JSON.stringify(e.response.data))
    });
}