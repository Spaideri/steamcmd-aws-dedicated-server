# SteamCMD AWS Dedicated Server - SteamEc2
Do it all project to deploy your own SteamCMD dedicated servers running on top of powerful AWS EC2 instances

## 1. Features
* Public static IP address - join games using the same parameters every time
* Optimized performance - choose the best instance type from the EC2 catalogue
* Best latency - deploy the server to the nearest AWS Region to you
* Cost-efficient - only pay for the running hours
* Persistent storage - game and mods are installed on a persistent disk
* Runs on Ubuntu Linux - linux EC2 prices are half of the equivalent Windows instances
* Scheduling - flexibly specify running hours to save cost

### 1.1 Planned features
* Discord bot - start/stop and operate the server through a Discord bot
* Custom CLI - simple CLI to operate servers from local machine

## 2. Supported Games
Contributions welcome, new games are easy to add see [/games/arma-reforger](/games/arma-reforger) for example
* Arma Reforger
* Arma3 (coming soon)

## 3. Prerequisites
* [Create AWS Account](https://docs.aws.amazon.com/accounts/latest/reference/welcome-first-time-user.html)
* [Create AWS IAM User with AdminAccess](https://docs.aws.amazon.com/singlesignon/latest/userguide/quick-start-default-idc.html)
* [Setup AWS CLI Credentials](https://docs.aws.amazon.com/singlesignon/latest/userguide/howtogetcredentials.html)
* [Install NodeJS](https://nodejs.org/en/download)
* [Install Packer](https://developer.hashicorp.com/packer/tutorials/docker-get-started/get-started-install-cli)

## 4. Deployment steps
* Build image from [server-image](/server-image)
* [Create a EC2 key pair](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/create-key-pairs.html) and record the name of the key pair
* Update [config.yaml](/config.yaml)
  * set awsAccountId - [AWS AccountId](https://docs.aws.amazon.com/accounts/latest/reference/manage-acct-identifiers.html)
  * set region - [AWS Region](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.RegionsAndAvailabilityZones.html)
  * set generated ec2 key pair name
  * set instanceClass and size - [EC2 Instance types](https://aws.amazon.com/ec2/instance-types/) - m7a, m7i, c7a, c7i provide the best performance
  * add at least one server
  * set dataVolumeSizeGB - add enough to fit all game and mod installations and add some head-space. 
  * (optional) add your public IP to whitelist for SSH access
* Add server configurations to [servers](/servers)
  * IMPORTANT use same serverName in config.yaml and for the directory name under servers
  * modify config files under /servers/your-server-name/
* Deploy infra from [aws-infra](/aws-infra)
* Login to AWS Console
  * IMPORTANT! Change region to your specified region from the top right hand corner
  * Open CloudWatch - Logs
  * See server sys.log to see server output

## 5. Operating

### 5.1 Start/Stop server
* set [runServer](https://github.com/Spaideri/steamcmd-aws-dedicated-server/blob/main/config.yaml#L22) to `true` or `false`

```
cd aws-infra
npx projen deploy --all
```

## 6. Costs
Example prices are from us-east-1 region. Cost vary between regions.
EC2 server costs directly depend on the running hours in month.
Other costs like Elastic IP and EBS data volume costs accumulate 24/7 as long as the resources exist.
Below are listed the most significant costs. Other costs apply but are minimal.

### Most significant costs

* Persistent EBS volume fixed cost: $0.08/GB/month, default 30GB disk $2.4/month
* Public static IP address - Elastic IP fixed cost: $3.6/month
* EC2 m7a.large	2cpu/8GB RAM costs $0.11592/hour

## 6. Contributions
Contributions are welcome

## 7. Motivation
I'm a long time Arma fan and I love the gaming community. Everyone deserves to get to play on well performing cost-efficient servers and this is my contribution to the community. 

## 8. Credits
* Inspired by [docker-reforger](https://github.com/acemod/docker-reforger/tree/main)
* EC2 snippets [@jlehtiniemi](https://github.com/jlehtiniemi)
