import { IDiscordSecrets } from './types'
import { getSecretValue } from '../utils/secrets-manager-client'

const DISCORD_BOT_SECRETS_NAME = process.env.DISCORD_BOT_SECRETS_NAME || ''

let discordSecrets: IDiscordSecrets | undefined = undefined;

export const getDiscordSecrets = async (): Promise<IDiscordSecrets> => {
  if(!discordSecrets) {
    const response = await getSecretValue(DISCORD_BOT_SECRETS_NAME)
    if (response.SecretString) {
      discordSecrets = JSON.parse(response.SecretString)
    }
  }
  return discordSecrets
}