#!/bin/bash -xe

echo "install-aws-tools.sh START"

# instal boto3
sudo pip3 install boto3

# install AWC CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
aws --version #run to check that it worked

# install ssm-agent
sudo apt install snapd
sudo snap install amazon-ssm-agent --classic
sudo snap start amazon-ssm-agent
echo "amazon-ssm-agent installed"

# install CW-agent
echo "starting CW agent"
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb -P /tmp/
cd /tmp
sudo dpkg -i -E ./amazon-cloudwatch-agent.deb
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c default
echo "checking CW agent status"
sudo systemctl status amazon-cloudwatch-agent
sudo systemctl stop amazon-cloudwatch-agent
echo "done ubuntu "

# install Cloudformation
sudo pip3 install https://s3.amazonaws.com/cloudformation-examples/aws-cfn-bootstrap-py3-latest.tar.gz

# symlink
sudo ln -s /usr/local/bin /opt/aws/bin
echo "install-aws-tools.sh DONE"