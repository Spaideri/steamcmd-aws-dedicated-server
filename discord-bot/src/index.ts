import 'dotenv/config';
import {
  REST,
  Routes, SlashCommandAttachmentOption,
  SlashCommandBuilder, SlashCommandStringOption,
  SlashCommandSubcommandBuilder, SlashCommandSubcommandGroupBuilder
} from 'discord.js'
import { listServerNames } from './files'

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN as string;
const DISCORD_BOT_APPLICATION_ID = process.env.DISCORD_BOT_APPLICATION_ID as string;
const DISCORD_SERVER_ID = process.env.DISCORD_SERVER_ID as string;

const serverNames = listServerNames();
const serversStringOption = new SlashCommandStringOption()
  .setName('server')
  .setRequired(true)
  .setDescription('Select server')
  .addChoices(...serverNames.map(name => {
    return { name: name, value: name }
  }))

const serverStartSubCommand = new SlashCommandSubcommandBuilder()
  .setName('start')
  .setDescription('Start server')
  .addStringOption(serversStringOption)

const serverStopSubCommand = new SlashCommandSubcommandBuilder()
  .setName('stop')
  .setDescription('Stop server')
  .addStringOption(serversStringOption)

const serverRestartSubCommand = new SlashCommandSubcommandBuilder()
  .setName('restart')
  .setDescription('Restart server')
  .addStringOption(serversStringOption)

const configurationViewSubCommand = new SlashCommandSubcommandBuilder()
  .setName('view')
  .setDescription('View server configuration')
  .addStringOption(serversStringOption)

const configurationUpdateSubCommand = new SlashCommandSubcommandBuilder()
  .setName('update')
  .setDescription('View server configuration')
  .addStringOption(serversStringOption)
  .addAttachmentOption(new SlashCommandAttachmentOption()
    .setName('config-file')
    .setRequired(true)
    .setDescription('Updated configuration file')
  )

const configurationSubCommandGroup = new SlashCommandSubcommandGroupBuilder()
  .setName('configuration')
  .setDescription('Manage configuration')
  .addSubcommand(configurationViewSubCommand)
  .addSubcommand(configurationUpdateSubCommand)

const builder = new SlashCommandBuilder()
  .setName('steamec2')
  .setDescription('SteamEc2 servers remote control')
  .addSubcommandGroup(configurationSubCommandGroup)
  .addSubcommand(serverStartSubCommand)
  .addSubcommand(serverStopSubCommand)
  .addSubcommand(serverRestartSubCommand)

const rest = new REST({ version: '10' }).setToken(DISCORD_BOT_TOKEN);

console.log('updating commands', builder.toJSON())

rest.put(
  Routes.applicationGuildCommands(DISCORD_BOT_APPLICATION_ID, DISCORD_SERVER_ID),
  { body: [builder.toJSON()] },
).then(result => {
  console.log('update success', result)
})
  .catch(e => {
    console.error(JSON.stringify(e));
  })
