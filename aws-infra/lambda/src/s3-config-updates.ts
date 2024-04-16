import { S3CreateEvent } from 'aws-lambda'
import { getRunningInstanceIdByServerName } from './utils/ec2-client'
import { restartGameServiceOnInstanceId } from './utils/ssm-client'

/* example update event
{
    "Records": [
        {
            "eventVersion": "2.1",
            "eventSource": "aws:s3",
            "awsRegion": "eu-north-1",
            "eventTime": "2024-04-09T05:13:12.727Z",
            "eventName": "ObjectCreated:Put",
            "userIdentity": {
                "principalId": "AWS:AROAZ6WCKOWE2ZI3AOROM:juho.rautio@webscale.fi"
            },
            "requestParameters": {
                "sourceIPAddress": "86.115.56.253"
            },
            "responseElements": {
                "x-amz-request-id": "BXWP7K243S4GR7EZ",
                "x-amz-id-2": "IOr1yiQy6A9mFtqJR6ZOtsf52clGhwOHzQsmp+Bhz7Ub4rr+9R8zmszUn8SLWJCGAuJA+vfPXM0wCQg8mKhF5bfYpqVYyufg"
            },
            "s3": {
                "s3SchemaVersion": "1.0",
                "configurationId": "ZGQ0YWQ1NzItNzNkMC00NGQxLWJlMzUtZDc5NzFjOGI1MGFh",
                "bucket": {
                    "name": "steamcmdconfigurationbuck-configurationbucketecc78-hjtoaralmuw0",
                    "ownerIdentity": {
                        "principalId": "A21EA67KIES4G3"
                    },
                    "arn": "arn:aws:s3:::steamcmdconfigurationbuck-configurationbucketecc78-hjtoaralmuw0"
                },
                "object": {
                    "key": "arma-reforger-server-01/arma-reforger.config.json",
                    "size": 377,
                    "eTag": "c073712187441441ed84f4cbf96e011e",
                    "sequencer": "006614CE68AC398BAD"
                }
            }
        }
    ]
}
*/

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
