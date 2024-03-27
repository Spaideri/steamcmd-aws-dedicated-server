#!/bin/bash
set -xe
set -o nounset

## SSHD Hardening
cat /opt/ec2/cfn-scripts/sshd-config-additions.txt >> /etc/ssh/sshd_config
systemctl restart sshd

PROPS_FILE="/opt/ec2/cfn-scripts/aws-props.json"

STACK_NAME=$(cat $PROPS_FILE | jq -r .stackName)
REGION=$(cat $PROPS_FILE | jq -r .region)
INSTANCE_NAME=$(cat $PROPS_FILE | jq -r .instanceName)
DATA_VOLUME=$(cat $PROPS_FILE | jq -r .dataVolume)
EIP_ALLOCATION_ID=$(cat $PROPS_FILE | jq -r .eipAllocationId)

## Fetch instance metadata
TOKEN=$(curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 900")
CF_AWS_STACKNAME=$STACK_NAME
CF_AWS_INSTANCE_ID=$(curl -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/instance-id)
CF_AWS_LOCAL_IP=$(curl -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/local-ipv4)
CF_AWS_INSTANCE_TYPE=$(curl -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/instance-type)

## Set instance metadata as global env variables in order to be able to use in other scripts
echo "AWS_REGION=$REGION" >> /etc/environment
echo "CF_AWS_STACKNAME=$CF_AWS_STACKNAME" >> /etc/environment
echo "CF_AWS_INSTANCE_ID=$CF_AWS_INSTANCE_ID" >> /etc/environment
echo "CF_AWS_LOCAL_IP=$CF_AWS_LOCAL_IP" >> /etc/environment
echo "CF_AWS_INSTANCE_TYPE=$CF_AWS_INSTANCE_TYPE" >> /etc/environment

if [ "$DATA_VOLUME" == "true" ]
then
  CF_AWS_DATA_VOLUME_ID=$(aws ec2 describe-volumes --region $REGION | jq -r ".Volumes[] | select(.Tags[]?.Key == \"Name\" and .Tags[]?.Value == \"$INSTANCE_NAME-data-volume\").VolumeId")
  echo "CF_AWS_DATA_VOLUME_ID=$CF_AWS_DATA_VOLUME_ID" >> /etc/environment

  ## Attach EBS Data volume
  echo "## Waiting for data volume to become available..."
  aws ec2 wait volume-available --region $REGION --volume-ids $CF_AWS_DATA_VOLUME_ID
  echo "## Data volume is available, attaching..."
  aws ec2 attach-volume --region $REGION --device /dev/sdh --instance-id $CF_AWS_INSTANCE_ID --volume-id $CF_AWS_DATA_VOLUME_ID
  echo "## Data volume to attached"

  sleep 10

  # Mount data volume, create file system if it doesn't exist
  DEVICE=nvme1n1
  DEV_PATH=/dev/$DEVICE

  DEVICE_ID=$(lsblk --fs --json | jq -r ".blockdevices[] | select(.name == \"$DEVICE\").uuid")

  if [ "$(lsblk --fs --json | jq -r ".blockdevices[] | select(.name == \"$DEVICE\").fstype")" == "null" ]
  then
    echo "## Plain EBS volume detected, creating file system and mounting..."
    mkfs -t xfs $DEV_PATH
  else
    echo "## Previously initialised EBS volume, mounting..."
  fi

  MOUNT_POINT="/data"

  echo "Mounting data volume to $MOUNT_POINT"
  mkdir -p $MOUNT_POINT
  mount $DEV_PATH $MOUNT_POINT

  # Set owner
  chown -R ubuntu:ubuntu $MOUNT_POINT

  # Update fstab...
  sed -i "\:^UUID=.*${MOUNT_POINT}.*$:d" /etc/fstab  ## Remove old entries if they exist
  echo "UUID=$DEVICE_ID  $MOUNT_POINT  xfs  defaults,nofail  0  2" >> /etc/fstab
  echo "## Data volume mounted ##"
fi

# Capture EIP
aws ec2 associate-address --region $REGION --instance-id $CF_AWS_INSTANCE_ID --allocation-id $EIP_ALLOCATION_ID --allow-reassociation