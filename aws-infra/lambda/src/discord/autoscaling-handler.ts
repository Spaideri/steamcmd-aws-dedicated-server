import { IDiscordEventRequest, ScalingAction, ScalingCommand, SubCommandL1 } from './types'
import { getDiscordSecrets } from './secrets'
import { sendFollowupMessage } from './discord-client'
import {
  findAutoscalingGroupByServerName,
  terminateInstanceById,
  updateDesiredCapacity
} from '../utils/autoscaling-client'
import { getRunningInstanceIdByServerName } from '../utils/ec2-client'

const respond = async (event: IDiscordEventRequest, responseContent: string): Promise<void> => {
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

export const handler = async (event: IDiscordEventRequest): Promise<string> => {
  try {
    console.log(`autoscaling-handler event: ${JSON.stringify(event)}`)

    const scalingCommand = event.jsonBody.data.options[0] as ScalingCommand
    const serverName = scalingCommand.options[0].value

    const autoScalingGroup = await findAutoscalingGroupByServerName(serverName)
    const instancesListString = autoScalingGroup.Instances.map(instance => {
      return `- InstanceId: ${instance.InstanceId} - state: ${instance.LifecycleState}`
    }).join('\n')

    switch (scalingCommand.name) {
      case ScalingAction.START:
        if (autoScalingGroup.DesiredCapacity === 1) {
          await respond(event, `Server ${serverName} desired state is already running.\n Instances: \n` + instancesListString)
        } else {
          await updateDesiredCapacity(autoScalingGroup.AutoScalingGroupName, 1)
          await respond(event, `Successfully set ${serverName} desired state to running`)
        }
        break;
      case ScalingAction.STOP:
        await updateDesiredCapacity(autoScalingGroup.AutoScalingGroupName, 0)
        await respond(event, `Successfully set ${serverName} desired state to terminated`)
        break;
      case ScalingAction.RESTART:
        const runningInstanceId = await getRunningInstanceIdByServerName(serverName);
        await terminateInstanceById(runningInstanceId)
        await respond(event, `Terminating ${serverName} running instanceId: ${runningInstanceId}. Autoscaling starting a new instance in few minutes`)
        break;
    }
    return '200';
  } catch (e) {
    console.error('autoscaling-handler error', e)
    return '500'
  }
}
