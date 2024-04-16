import { S3CreateEvent } from 'aws-lambda'
import { getRunningInstanceIdByServerName } from './utils/ec2-client'
import { restartGameServiceOnInstanceId } from './utils/ssm-client'

const restartServerGameService = async (serverName: string): Promise<any> => {
  const instanceId = await getRunningInstanceIdByServerName(serverName);
  console.log(`running ssm command to restart game service on ${serverName} ${instanceId}`)
  const result = await restartGameServiceOnInstanceId(instanceId);
  console.log(`command status in result: ${result.Command.Status}`)
  return result
}

export const handler = async (event: S3CreateEvent): Promise<any> => {
  console.log('s3Event', JSON.stringify(event))

  return await Promise.all(
    event.Records
      .filter(record => record.eventName === 'ObjectCreated:Put')
      .map(record => record.s3.object.key.split('/')[0])
      .reduce((arr, serverName) => {
        if (arr.indexOf(serverName) < 0) {
          arr.push(serverName)
        }
        return arr;
      }, [])
      .map(restartServerGameService)
  )
    .catch(e => {
      console.error(`Error restarting game service`, e)
    })
}
