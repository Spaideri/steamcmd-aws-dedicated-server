import { sign } from 'tweetnacl';
import { IDiscordEventRequest, SubCommandL1 } from './types'
import { getDiscordSecrets } from './secrets'
import { invokeLambda } from '../utils/lambda-client'


const DISCORD_AUTOSCALING_LAMBDA_ARN = process.env.DISCORD_AUTOSCALING_LAMBDA_ARN;
const DISCORD_CONFIGURATION_LAMBDA_ARN = process.env.DISCORD_CONFIGURATION_LAMBDA_ARN;

export const handler = async (event: IDiscordEventRequest): Promise<any> => {
  try {
    console.log(`Event: ${JSON.stringify(event)}`);

    await verifyEvent(event)

    switch (event.jsonBody.type) {
      default:
        throw new Error('default, should not come here')
      case 1:
        // Return pongs for pings
        console.log('pong responding with type: 1')
        return{
          type: 1,
        };
      case 2:
        // Invoke the lambda to respond to the deferred message.
        await handleSubCommand(event);
        console.log('invoked autoscaling lambda responding with type: 5')
        return {
          'type': 5
        }
    }
  } catch (e) {
    console.error(`handler error`, e)
    throw new Error('[UNAUTHORIZED] invalid request signature');
  }
}

const handleSubCommand = (event: IDiscordEventRequest): Promise<any> => {
  const subCommand = event.jsonBody.data.options[0].name as SubCommandL1
  switch (subCommand) {
    case SubCommandL1.START:
    case SubCommandL1.STOP:
    case SubCommandL1.RESTART:
      return invokeLambda(DISCORD_AUTOSCALING_LAMBDA_ARN, event);
    case SubCommandL1.CONFIGURATION:
      return invokeLambda(DISCORD_CONFIGURATION_LAMBDA_ARN, event);
    default:
      throw new Error(`Invalid subCommand ${subCommand}`)
  }
}

export const verifyEvent = async (event: IDiscordEventRequest): Promise<void> => {
  const discordSecrets = await getDiscordSecrets();
  const valid = sign.detached.verify(
    Buffer.from(event.timestamp + JSON.stringify(event.jsonBody)),
    Buffer.from(event.signature, 'hex'),
    Buffer.from(discordSecrets?.publicKey ?? '', 'hex'),
  );
  if(!valid) {
    throw new Error('[UNAUTHORIZED] invalid request signature');
  }
}