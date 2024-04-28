import { CloudWatchClient, PutMetricDataCommand, PutMetricDataCommandOutput } from '@aws-sdk/client-cloudwatch'
import { MetricEvent } from '../types'

const client = new CloudWatchClient({
  region: process.env.REGION
});

export const putServerFpsMetricData = async (serverName: string, metricData: MetricEvent): Promise<PutMetricDataCommandOutput> => {
  const input = { // PutMetricDataInput
    Namespace: serverName,
    MetricData: [metricData],
    StorageResolution: 1 // HighResolution metric
  };
  const command = new PutMetricDataCommand(input);
  return client.send(command)
}
