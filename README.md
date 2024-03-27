# SteamCDM AWS Dedicated Server - SteamEc2
Do it all project to deploy your own SteamCMD dedicated servers running on top of powerful AWS EC2 instances

## 1. Features
* Public static IP address - join games using the same parameters every time
* Optimized performance - choose the best instance type from the EC2 catalogue
* Best latency - deploy the server to the nearest AWS Region to you
* Cost-efficient - only pay for the running hours
* Persistent storage - game and mods are installed on a persistent disk
* Runs on Ubuntu Linux - linux EC2 prices are half of the equivalent Windows instances

### 1.1 Planned features
* Scheduling(coming soon) - specify running hours to save cost
* Discord bot - start/stop and operate the server through a Discord bot
* Custom CLI - simple CLI to operate servers from local machine

## 2. Supported Games
Contributions welcome, support new games are easy to add
* Arma Reforger
* Arma3 (coming soon)

## 3. Prerequisites
* AWS Account
* AWS IAM User with AdminAccess
* AWS Access Keys configured
* NodeJS installed
* Packer installed

## 4. Deployment steps
* Build image from [server-image](/server-image)
* Generate AWS EC2 key pair to your own region
* Update [config.yaml](/config.yaml)
  * set awsAccountId
  * set region
  * set generated ec2 key pair name
  * set ec2 instanceType
  * add at least one server
  * (optional) add your public IP to whitelist for SSH access
* Add server configurations to [servers](/servers)
  * IMPORTANT use same serverName in config.yaml and for the directory name under servers
  * modify config files under /servers/your-server-name/
* Deploy infra from [aws-infra](/aws-infra)
* Login to AWS Console
  * IMPORTANT! Change region to your specified region from the top right hand corner
  * Open CloudWatch - Logs
  * See server sys.log to see server output

## 6. Contributions
Contributions are welcome

## 5. Motivation
I'm a long time Arma fan and I love the gaming community. Everyone deserves to get to play on well performing cost-efficient servers and this is my contribution to the community. 

## Credits
* Inspired by [docker-reforger](https://github.com/acemod/docker-reforger/tree/main)
* EC2 snippets [@jlehtiniemi](https://github.com/jlehtiniemi)
