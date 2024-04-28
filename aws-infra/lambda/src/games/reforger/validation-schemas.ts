import { z } from 'zod'

export const fpsLogMessagePattern = /^.*(FPS\: )(\d+).*$/

const ipAddress = z.string().regex(/^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/).optional()
const port = z.string().min(1024).max(65535).optional()
export enum ConfigurationFile {
  REFORGER_ARGUMENTS_JSON = 'reforger.arguments.json',
  REFORGER_CONFIG_JSON = 'reforger.config.json',
  STEAMCMD_CONFIG_JSON = 'steamcmd.config.json',
}

export const ReforgerArgumentsSchema = z.object({
  backendlog: z.string().regex(/^-backendlog$/).optional(),
  maxFPS: z.string().regex(/^-maxFPS [1-9]\d*$/).optional(),
  nothrow: z.string().regex(/^-nothrow$/).optional(),
  logLevel: z.string().regex(/^-logLevel (normal|warning|error|fatal)$/).optional(),
});
export type ReforgerArguments = z.infer<typeof ReforgerArgumentsSchema>
export const SteamCmdConfigSchema = z.object({
  steamAppId: z.string().regex(/^1874900|1890870$/),
  steamUser: z.string().optional(),
  steamPassword: z.string().optional(),
  steamBranch: z.string().optional(),
  steamBranchPassword: z.string().optional()

});
export type SteamCmdConfig = z.infer<typeof SteamCmdConfigSchema>

// https://community.bistudio.com/wiki/Arma_Reforger:Server_Config
export const ReforgerConfigSchema = z.object({
  bindAddress: ipAddress,
  bindPort: port,
  publicPort: port,
  a2s: z.object({
    address: ipAddress,
    port: port
  }).optional(),
  rcon: z.object({
    address: ipAddress,
    port: port,
    password: z.string().optional(),
    permission: z.string().optional(),
    blacklist: z.array(z.string()).optional(),
    whitelist: z.array(z.string()).optional(),
  }).optional(),
  game: z.object({
    name: z.string().min(0).max(100).optional(),
    password: z.string().min(0).max(100).optional(),
    passwordAdmin: z.string().min(0).max(100).optional(),
    admins: z.array(z.string().min(1).max(100)).optional(),
    scenarioId: z.string().optional(),
    maxPlayers: z.number().min(1).max(256).optional(),
    visible: z.boolean().optional(),
    supportedPlatforms: z.array(z.string().regex(/^PLATFORM_PC|PLATFORM_XBL$/)).optional(),
    gameProperties: z.object({
      serverMaxViewDistance: z.number().min(500).max(10000).optional(),
      serverMinGrassDistance: z.number().min(0).max(150).optional(),
      networkViewDistance: z.number().min(500).max(5000).optional(),
      disableThirdPerson: z.boolean().optional(),
      fastValidation: z.boolean().optional(),
      battlEye: z.boolean().optional(),
      VONDisableUI: z.boolean().optional(),
      VONDisableDirectSpeechUI: z.boolean().optional(),
      VONCanTransmitCrossFaction: z.boolean().optional(),
      missionHeader: z.object({
        'm_iPlayerCount': z.number().optional(),
        'm_eEditableGameFlags': z.number().optional(),
        'm_eDefaultGameFlags': z.number().optional()
      }).optional()
    }).optional(),
    mods: z.array(z.object({
      modId: z.string(),
      name: z.string().optional(),
      version: z.string()
    })).optional()
  })
});
export type ReforgerConfig = z.infer<typeof ReforgerConfigSchema>

const ReforgerConfigurationFileSchemas = {}
ReforgerConfigurationFileSchemas[ConfigurationFile.REFORGER_ARGUMENTS_JSON] = ReforgerArgumentsSchema
ReforgerConfigurationFileSchemas[ConfigurationFile.REFORGER_CONFIG_JSON] = ReforgerConfigSchema
ReforgerConfigurationFileSchemas[ConfigurationFile.STEAMCMD_CONFIG_JSON] = SteamCmdConfigSchema

export { ReforgerConfigurationFileSchemas }