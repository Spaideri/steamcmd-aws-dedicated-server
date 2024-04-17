import { ConfigurationAction, IDiscordEventRequest, IDiscordRequestDataResolvedAttachment } from './types'

import { downloadFile, respond } from './utils'
import { putServerConfigurationFile } from '../utils/s3-client'
import { readFileSync } from 'fs'
import { ReforgerConfigurationFileSchemas } from './games/reforger/validation-schemas'

const GameValidationSchemas = {
  'reforger': ReforgerConfigurationFileSchemas
}

const handleConfigurationFileUpload = async (gameName: string, serverName: string, attachment: IDiscordRequestDataResolvedAttachment): Promise<void> => {
  const validationSchemas = GameValidationSchemas[gameName]
  const allowedConfigurationFiles = Object.keys(validationSchemas)

  if(allowedConfigurationFiles.includes(attachment.filename)) {
    const fileName = `/tmp/${attachment.id}`
    await downloadFile(attachment.url, fileName)
    const rawData = readFileSync(fileName, 'utf8')
    const configurationObject = JSON.parse(rawData);
    validationSchemas[attachment.filename].parse(configurationObject);
    console.log(`downloaded new configuration file: ${rawData}`)
    console.log(`uploading configuration file to: ${serverName}/${attachment}`)
    await putServerConfigurationFile(serverName, attachment.filename, rawData)
    console.log(`upload complete`)
  } else {
    throw new Error(`Illegal configuration file name ${attachment.filename}, allowed names: ${allowedConfigurationFiles.join(', ')}`);
  }
}

export const handler = async (event: IDiscordEventRequest): Promise<string> => {
  try {
    console.log(`configuration-handler event: ${JSON.stringify(event)}`)

    const configurationCommand = event.jsonBody.data.options[0]
    const action = configurationCommand.options[0].name as ConfigurationAction
    const serverName = configurationCommand.options[0].options[0].value as string
    const gameName = serverName.split('-')[0]

    switch (action) {
      default:
        throw new Error(`Invalid command name ${action}`)
      case ConfigurationAction.UPDATE:
        await Promise.all(configurationCommand.options[0].options.slice(1)
          .map(async ({ name, value }) => {
            const attachment = event.jsonBody.data.resolved.attachments[value as string]
            return handleConfigurationFileUpload(gameName, serverName, attachment)
          })
        )
        await respond(event, `:white_check_mark: Successfully updated ${serverName} configuration`)
        break;
    }
    return '200';
  } catch (e) {
    console.error('autoscaling-handler error', e)
    await respond(event, `:x: Error processing configuration files: ${e.message}`)
    return '500'
  }
}
