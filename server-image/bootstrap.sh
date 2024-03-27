#!/bin/bash -xe

echo "bootstrap.sh START"
sudo add-apt-repository multiverse -y;
sudo dpkg --add-architecture i386;
sudo apt -y update
sudo apt-get update -y
sudo apt install jq -y
sudo apt install python3 -y
sudo apt install python3-pip -y
sudo apt install unzip -y

echo "bootstrap.sh DONE"