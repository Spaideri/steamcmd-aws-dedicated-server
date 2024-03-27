import json
import os

STEAMCMD_CONFIG_FILE_PATH = "/data/{}/steamcmd.config.json".format(os.environ["SERVER_NAME"])

def load_json_file(path):
    f = open(path)
    data = json.load(f)
    f.close()
    return data

steamcmd_config = load_json_file(STEAMCMD_CONFIG_FILE_PATH)

print(steamcmd_config)

STEAM_FORCE_INSTALL_DIR = "/data/{}/{}".format(steamcmd_config['serverName'], steamcmd_config['gameName'])

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
print(init_command)
os.system(init_command)