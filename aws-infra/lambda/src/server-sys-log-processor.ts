import * as zlib from 'zlib'
import { LogEvent, MetricEvent } from './types'
import { putServerFpsMetricData } from './utils/cloudwatch-client'
import { fpsLogMessagePattern  as reforgerFpsLogMessagePattern } from './games/reforger/validation-schemas'

const FPS_LOG_MESSAGE_PATTERN = {
  'reforger': reforgerFpsLogMessagePattern
}

const GAME = process.env.GAME as string;
const SERVER_NAME = process.env.SERVER_NAME as string;

exports.handler = function(input, context) {
  const payload = Buffer.from(input.awslogs.data, 'base64');
  let metricEvent: MetricEvent | null = null;

  zlib.gunzip(payload, (e, result) => {
    if (e) {
      console.error(e);
      context.fail(e);
    } else {
      const eventData = JSON.parse(result.toString());
      const logEvents = eventData.logEvents as LogEvent[]

      console.log('LogEvents', JSON.stringify(logEvents))

      const minFps = Math.min(...logEvents
        .filter(event => event.message.match(FPS_LOG_MESSAGE_PATTERN[GAME]))
        .map(({ message }) => {
          return Number.parseFloat(message.match(FPS_LOG_MESSAGE_PATTERN[GAME])[2]);
        })
      )

      metricEvent = {
        'MetricName': 'minFps',
        'Timestamp': new Date(logEvents[0].timestamp),
        'Value': isFinite(minFps) ? minFps : 0,
      }
      putServerFpsMetricData(SERVER_NAME, metricEvent)
        .then(() => {
          context.succeed();
        })
        .catch(context.fail)
    }
  });
};