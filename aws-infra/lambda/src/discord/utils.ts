import { IDiscordEventRequest } from './types'
import { getDiscordSecrets } from './secrets'
import { sendFollowupMessage } from './discord-client'
import { Readable } from 'node:stream'
import * as fs from 'fs'
import * as fspromise from 'fs/promises'
import { finished } from 'node:stream/promises'

export const respond = async (event: IDiscordEventRequest, responseContent: string): Promise<void> => {
  const discordSecret = await getDiscordSecrets();
  const endpointInfo = {
    authToken: discordSecret?.authToken,
    applicationId: discordSecret?.applicationId,
    botToken: discordSecret?.botToken
  };
  const response = {
    tts: false,
    content: responseContent,
    embeds: [],
    allowedMentions: {},
  };
  return sendFollowupMessage(endpointInfo, event.jsonBody.token, response)
}

export const downloadFile = async (url: string, fileName: string): Promise<void> => {
  const response = await fetch(url);
  const fileStream = fs.createWriteStream(fileName, { flags: 'wx' });
  // @ts-ignore
  return finished(Readable.fromWeb(response.body).pipe(fileStream));
}

export const readFile = (fileName: string): Promise<Buffer> => {
  return fspromise.readFile(fileName)
}
