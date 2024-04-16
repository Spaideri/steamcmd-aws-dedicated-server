# [1.2.0](https://github.com/Spaideri/steamcmd-aws-dedicated-server/compare/v1.1.0...v1.2.0) (2024-04-16)


### Features

* **discord-bot:** initial implemantation of the Discord bot with start/stop/restart commands ([5e1395b](https://github.com/Spaideri/steamcmd-aws-dedicated-server/commit/5e1395ba570479add8400b21e5b7ca0d7e756665))

# [1.1.0](https://github.com/Spaideri/steamcmd-aws-dedicated-server/compare/v1.0.0...v1.1.0) (2024-04-09)


### Features

* **configs:** automatically restart the game server systemd service when configuration files are updated in the configurations s3 bucket ([6d02ae7](https://github.com/Spaideri/steamcmd-aws-dedicated-server/commit/6d02ae7744a7949b03d8ab397e27c71d030d50dd))
* **scheduling:** server running hours can be defined in the config ([76f89c7](https://github.com/Spaideri/steamcmd-aws-dedicated-server/commit/76f89c79407db383e99dc651ece899ae55b128fe))
* **server:** load configuration files from s3 configurations bucket on startup ([6b14794](https://github.com/Spaideri/steamcmd-aws-dedicated-server/commit/6b1479445c3c55e22540033b46f7c359a970133b))

# 1.0.0 (2024-04-08)


### Bug Fixes

* **aws-infra:** projen project fix ([59ed3d5](https://github.com/Spaideri/steamcmd-aws-dedicated-server/commit/59ed3d57d9217bb0de67c41a93cd0627cca88be9))
* **gitignore:** add cdk generated files to gitignore ([0cb78cf](https://github.com/Spaideri/steamcmd-aws-dedicated-server/commit/0cb78cfe768260b03e25ec2edb316e05fe4743f8))
* **README:** restored infra readme with npm install step ([28a888a](https://github.com/Spaideri/steamcmd-aws-dedicated-server/commit/28a888a20f113a131d4f5158fd4a1070d3bf9d3c))
* **release:** remove npm plugin ([0318598](https://github.com/Spaideri/steamcmd-aws-dedicated-server/commit/031859804a86ccdd34bd013a804722fcf0373a7a))
* **release:** removed husky install script ([205eb18](https://github.com/Spaideri/steamcmd-aws-dedicated-server/commit/205eb187bf825d9ee7c90112262b8b319408de7a))
* **server:** fixed intial deployment failing ([d48794b](https://github.com/Spaideri/steamcmd-aws-dedicated-server/commit/d48794b5f1c40392363485b328b81205ddbccee0))


### Features

* **config:** add runServer attribute to main config server to enable start and stop ([07bad65](https://github.com/Spaideri/steamcmd-aws-dedicated-server/commit/07bad659db249562660eb9a4fe28ae72eee20141))
* **release:** semantic release workflow ([47665be](https://github.com/Spaideri/steamcmd-aws-dedicated-server/commit/47665bee1a13846578d1ca694378e68bfcb572a9))
