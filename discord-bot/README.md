# Discord bot

## 1. Bot commands

### 1.1 start
Starts your game server

`/steamec2 start server:reforger-server-01`

### 1.2 stop
Stops and terminates your game server instance

`/steamec2 stop server:reforger-server-01`

### 1.3 restart
Terminates the running game server instance and lets autoscaling to start a new instance 

`/steamec2 restart server:reforger-server-01`

### 1.4 configuration update
Upload new configuration file and the game server service will restart with your updated configurations

`/steamec2 configuration update server:reforger-server-01 config-file: reforger.config.json`

## 2. Install instructions

### 2.1 Create Discord bot
* Login to [Discord Developer Portal](https://discord.com/developers/applications)
* Click "New Application" 
* Give any name to your application, for example: SteamEc2
  * optionally select Icon and write description
* Record APPLICATION ID and PUBLIC KEY to any text editor, you need these later
* [Sign in to you AWS account console](https://docs.aws.amazon.com/signin/latest/userguide/console-sign-in-tutorials.html)
  * Make sure you are on the correct region from the top right hand corner
  * Type "ApiGateway" to the AWS console search field in top left and open the service console
  * Click to open the "steamcmd-discord-api" from the list
  * Click "Dashboard" from the left navigation pane
  * Copy the "Invoke URL", paste to your text editor and append the URL with "event"
    * The complete invoke url should look like `https://xyz123.execute-api.eu-north-1.amazonaws.com/prod/event`
* Return to Discord developer portal
* Copy paste the above invoke url appended with the "event" suffix to the `INTERACTIONS ENDPOINT URL` field in the Discord
* Click "Save Changes" in the bottom
* Open "Installation" tab from the left pane
  * Select "Guild Install" for the `Authorization Methods`
* Open "OAuth2" from the left pane
  * Record the "CLIENT SECRET", it is the `authToken` in the below
  * Use "OAuth2 URL Generator" and select "SCOPES":
    * application.commands
    * bot
  * From "BOT PERMISSIONS" select
    * "Send Messages"
    * "Attach Files"
  * Record the "GENERATED URL" from the bottom. This URL is used to invite the Bot to your Discord Server
* Open "Bot" tab from the left pane
  * Record the "TOKEN", use "Reset Token" if necessary. This is the `botToken` in the below command
  * Unselect the "PUBLIC BOT" to keep your bot private
* Record your discord server (guild id) 
  * ```To get the server ID, open Discord, go to Settings → Advanced and enable developer mode. Then, right-click on the server title and select "Copy ID" to get the server ID.```

### 2.2 Update Discord bot secrets to AWS
* test your AWS credentials are active and working by running `aws sts get-caller-identity`
* Use the following command with your previously recorded information, remember to change the region to your region
```
aws secretsmanager put-secret-value \
      --region eu-north-1 \
      --secret-id discord-bot-secrets \
      --secret-string "{ \
	\"publicKey\":\"REPLACE_WITH_YOUR_DISCORD_APP_PUBLIC_KEY\",\
	\"authToken\":\"VALUE_FROM_CLIENT_SECRET\",\
	\"botToken\":\"BOT_TOKEN\",\
	\"applicationId\":\"YOUR_APPLICATION_ID\"\
	}"
```
* Copy and paste the above command formatted with your ID's to the console and run the command

### 2.3 Invite the bot to your channel
* Copy and paste the OAuth2 "GENERATED URL" from the previous step to your Discord server channel to invite the bot

### 2.4 Deploy the discord bot commands
* Create new file `.env` to the root of the `disccord-bot` directory with the below content with secrets from the previous step
```
DISCORD_BOT_TOKEN=""
DISCORD_BOT_APPLICATION_ID=""
DISCORD_SERVER_ID=""
```
* In the `discord-bot` directory run
* ```npm install```
* ```npm run deploy```

Now you should be able to run the command on your Discord server to control your game servers