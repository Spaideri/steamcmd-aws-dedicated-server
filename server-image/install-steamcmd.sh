#!/bin/bash -xe

echo "install-steamcmd.sh -y START"
echo steam steam/question select "I AGREE" | sudo debconf-set-selections
echo steam steam/license note '' | sudo debconf-set-selections
sudo apt install steamcmd -y
mkdir /home/ubuntu/.steam
echo "install-steamcmd.sh DONE"