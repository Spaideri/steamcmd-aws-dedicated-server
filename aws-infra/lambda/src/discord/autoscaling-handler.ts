import { IDiscordEventRequest, ScalingAction, ScalingCommand } from './types'
import {
  findAutoscalingGroupByServerName,
  terminateInstanceById,
  updateDesiredCapacity
} from '../utils/autoscaling-client'
import { getRunningInstanceIdByServerName } from '../utils/ec2-client'
import { respond } from './utils'

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
          await respond(event, `:warning: Server ${serverName} desired state is already running.\n Instances: \n` + instancesListString)
        } else {
          await updateDesiredCapacity(autoScalingGroup.AutoScalingGroupName, 1)
          await respond(event, `:arrow_forward: Successfully set ${serverName} desired state to running`)
        }
        break;
      case ScalingAction.STOP:
        await updateDesiredCapacity(autoScalingGroup.AutoScalingGroupName, 0)
        await respond(event, `:octagonal_sign: Successfully set ${serverName} desired state to terminated`)
        break;
      case ScalingAction.RESTART:
        const runningInstanceId = await getRunningInstanceIdByServerName(serverName);
        await terminateInstanceById(runningInstanceId)
        await respond(event, `:recycle: Terminating ${serverName} running instanceId: ${runningInstanceId}. Autoscaling starting a new instance in few minutes`)
        break;
    }
    return '200';
  } catch (e) {
    console.error('autoscaling-handler error', e)
    return '500'
  }
}
