# AWS CDK Infra project
This project creates all the necessary AWS cloud infra resources required to deploy and run your servers

## Prerequisites
* server image has been build
* main config.yaml updated
* AWC credentials configured
* NodeJS installed

## 1. Initial Setup

#### 1.1 Install dependencies
`cd lambda`

`npm install`

`cd ..`

`npm install`

`npx projen build`

### 1.2 CDK bootstrap
Replace 123456789012 with your AWS account Id and eu-north-1 with the region you wish to use

```npx cdk bootstrap 123456789012/eu-north-1```

## 2. Deployment command

### 2.1 Deploy CDK project
`npx cdk deploy --all --require-approval never`

## 3. Destroy everything

### 3.1 AWS console 
* Sing in to the AWS console
* Navigate to S3 service
* Find the configuration bucket named something like `steamcmdconfigurationbuck-configurationbucketxxx123-xxyyzzz`
* Open the bucket and delete all the files in the bucket
* Navigate to EC2 service in the console
* Open "AMIs" from the left navigation
* Deregister AMIs with name `steamcmd-ubuntu-server`

### 3.2 CDK project
* Open CLI and navigate to the `aws-infra` directory
* Run `npx cdk destroy --all`