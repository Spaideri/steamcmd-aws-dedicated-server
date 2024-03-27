# AWS CDK Infra project
This project creates all the necessary AWS cloud infra resources required to deploy and run your servers

## Prerequisites
* server image has been build
* main config.yaml updated
* AWC credentials configured
* NodeJS installed

## 1. Initial Setup

#### 1.1 Install dependencies
`npm install`

`npx projen build`

### 1.2 CDK bootstrap
Replace 123456789012 with your AWS account Id and eu-north-1 with the region you wish to use

```npx cdk bootstrap 123456789012/eu-north-1```

## 2. Deployment command

### 2.1 Deploy CDK project
`npx projen deploy --all`