import { SNSEvent } from 'aws-lambda'
import { sendChannelMessage } from './discord-client'
import { getDiscordSecrets } from './secrets'
import { AutoScalingMessage, CloudWatchAlarmMessage } from './types'

const DISCORD_SERVER_MESSAGES_CHANNEL_ID = process.env.DISCORD_SERVER_MESSAGES_CHANNEL_ID as string;

enum MessageType {
  AUTOSCALING,
  CW_ALARM
}
const formatMessage = (rawMessage: string): string => {
  const messageObject = JSON.parse(rawMessage);
  let messageType
  if(messageObject?.['Service'] === 'AWS Auto Scaling') {
    messageType = MessageType.AUTOSCALING
  } else if(messageObject?.['AlarmName'] != null) {
    messageType = MessageType.CW_ALARM
  }
  switch (messageType) {
    default:
      throw new Error(`Invalid message type in message ${rawMessage}`)
    case MessageType.AUTOSCALING:
      const autoscalingMessage = messageObject as AutoScalingMessage;
      const action = autoscalingMessage.Description.split(' ')[0]
      const emoji = action === 'Launching'
        ? ':arrow_forward:'
        : ':octagonal_sign:'
      return `${emoji} ${autoscalingMessage.Description}`
    case MessageType.CW_ALARM:
      const cwMessage = messageObject as CloudWatchAlarmMessage;
      const state = cwMessage.NewStateValue
      if (state === 'OK') {
        return ':arrow_forward: Game server process has started successfully!'
      } else {
        return ':octagonal_sign: Game server process has stopped!'
      }
  }
}

export const handler = async (event: SNSEvent): Promise<any> => {
  console.log(`Event: ${JSON.stringify(event)}`);
  try {
    const discordSecret = await getDiscordSecrets();
    const endpointInfo = {
      authToken: discordSecret?.authToken,
      applicationId: discordSecret?.applicationId,
      botToken: discordSecret?.botToken
    };
    const formattedMessage = formatMessage(event.Records[0].Sns.Message)
    await sendChannelMessage(endpointInfo, DISCORD_SERVER_MESSAGES_CHANNEL_ID, formattedMessage)

    return '200'
  } catch (e) {
    console.error(`handler error`, e)
  }
}