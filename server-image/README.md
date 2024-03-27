# Server Image
This is a Packer project to build a base AMI for the SteamCDM server

## Building image

### Prerequisites
* [Packer](https://developer.hashicorp.com/packer/tutorials/docker-get-started/get-started-install-cli) installed
* Set your region to the aws-ubuntu.pkr.hcl file
* Configure AWS credentials

### Build image

`packer build aws-ubuntu.pkr.hcl`

## Base image
`ubuntu-jammy-22.04-amd64-server`

## Installed Software
* SteamCDM (CLI Steam client)
* Cloudformation bootstrap
* CloudWatch Agent
* AWS CLI v2
* boto3 Python AWS library
* AWS SSM Agent
* Nodejs
