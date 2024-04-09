import { z } from 'zod';

export enum Game {
  ARMA_REFORGER = 'arma-reforger'
}

const CronOptionsSchema = z.object({
  day: z.string().optional(),
  hour: z.string().optional(),
  minute: z.string().optional(),
  month: z.string().optional(),
  weekDay: z.string().optional(),
  year: z.string().optional(),
})

const ServerConfigurationSchema = z.object({
  serverName: z.string().min(2).max(32),
  game: z.nativeEnum(Game),
  dataVolumeSizeGB: z.number().min(1).max(1000),
  instanceClass: z.string(),
  instanceSize: z.string(),
  runServer: z.boolean(),
  shutDownSchedule: CronOptionsSchema.optional(),
  startUpSchedule: CronOptionsSchema.optional(),
  firewallOpenings: z.array(z.object({
    description: z.string(),
    protocol: z.string().regex(/^udp|tcp$/),
    portNumber: z.number(),
    sourceCIDR: z.string().optional(),
  })),
});
export type ServerConfiguration = z.infer<typeof ServerConfigurationSchema>

export const ConfigurationSchema = z.object({
  accountId: z.string(),
  amiName: z.string(),
  region: z.string(),
  keyPairName: z.string(),
  sshIpAddressWhitelist: z.array(z.string()),
  servers: z.array(ServerConfigurationSchema),
});
export type Configuration = z.infer<typeof ConfigurationSchema>

