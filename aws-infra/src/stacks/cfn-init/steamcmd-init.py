import json
import os
import sys
import boto3

SERVER_NAME = sys.argv[1]
GAME_NAME = sys.argv[2]
CONFIGURATION_BUCKET_NAME = sys.argv[3]
STEAMCMD_CONFIG_OBJECT_NAME = f"{SERVER_NAME}/steamcmd.config.json"
STEAMCMD_CONFIG_FILE_PATH = f"/data/{SERVER_NAME}/steamcmd.config.json"

s3 = boto3.client('s3')
s3.download_file(CONFIGURATION_BUCKET_NAME, STEAMCMD_CONFIG_OBJECT_NAME, STEAMCMD_CONFIG_FILE_PATH)

def load_json_file(path):
    f = open(path)
    data = json.load(f)
    f.close()
    return data

steamcmd_config = load_json_file(STEAMCMD_CONFIG_FILE_PATH)

print("steamcmd-init.py START")
print(steamcmd_config)

STEAM_FORCE_INSTALL_DIR = f"/data/{SERVER_NAME}/{GAME_NAME}"

steamcmd = ['/usr/games/steamcmd']
steamcmd.extend(["+force_install_dir", STEAM_FORCE_INSTALL_DIR])

if "steamUser" in steamcmd_config:
    steamcmd.extend(["+login", steamcmd_config['steamUser'], steamcmd_config['steamPassword']])
else:
    steamcmd.extend(["+login", "anonymous"])

steamcmd.extend(["+app_update", steamcmd_config['steamAppId']])
steamcmd.extend(["-beta", steamcmd_config['steamBranch']])

if "steamBranchPassword" in steamcmd_config:
    steamcmd.extend(["-betapassword", steamcmd_config['steamBranchPassword']])

steamcmd.extend(["validate", "+quit"])
init_command = " ".join(steamcmd)
print(f"Running steamcmd: {init_command}")
os.system(init_command)
print("steamcmd-init COMPLETE")