#!/bin/bash -xe

curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh script| bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 20
node -v
npm -v
npm install -g pm2
