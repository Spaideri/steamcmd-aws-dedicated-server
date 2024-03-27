#!/usr/bin/env python3
import json
import os
import sys

SERVER_NAME = sys.argv[1]
GAME_NAME = sys.argv[2]

DEFAULT_GAME_ARGUMENTS_FILE_PATH = f"/data/{SERVER_NAME}/default.arguments.json"
DEFAULT_CONFIG_FILE_PATH = f"/data/{SERVER_NAME}/default.config.json"
SERVER_GAME_CONFIG_FILE_PATH = f"/data/{SERVER_NAME}/{GAME_NAME}.config.json"
SERVER_GAME_ARGUMENTS_FILE_PATH = f"/data/{SERVER_NAME}/{GAME_NAME}.arguments.json"
GENERATED_CONFIG_FILE_PATH = f"/data/{SERVER_NAME}/generated.config.json"
STEAM_FORCE_INSTALL_DIR = f"/data/{SERVER_NAME}/{GAME_NAME}"
WORKSHOP_DIR = f"/data/{SERVER_NAME}/workshop"
GAME_BINARY = f"/data/{SERVER_NAME}/{GAME_NAME}/ArmaReforgerServer"
GAME_PROFILE_DIRECTORY = f"/data/{SERVER_NAME}"

def load_json_file(path):
    f = open(path)
    data = json.load(f)
    f.close()
    return data

def recursive_merge(dict1, dict2):
    for key, value in dict2.items():
        if key in dict1 and isinstance(dict1[key], dict) and isinstance(value, dict):
            # Recursively merge nested dictionaries
            dict1[key] = recursive_merge(dict1[key], value)
        else:
            # Merge non-dictionary values
            dict1[key] = value
    return dict1

# Overwrite default configuration with server specific configurations
server_game_config = load_json_file(SERVER_GAME_CONFIG_FILE_PATH)
default_game_config = load_json_file(DEFAULT_CONFIG_FILE_PATH)
generated_config = recursive_merge(default_game_config, server_game_config)

# Combine default and optional arguments
server_game_arguments = load_json_file(SERVER_GAME_ARGUMENTS_FILE_PATH)
default_server_game_arguments = load_json_file(DEFAULT_GAME_ARGUMENTS_FILE_PATH)
resolved_game_arguments = recursive_merge(default_server_game_arguments, server_game_arguments)

json_game_config = json.dumps(generated_config, indent=2)
with open(GENERATED_CONFIG_FILE_PATH, "w") as outfile:
    outfile.write(json_game_config)

launch = " ".join(
    [
        GAME_BINARY,
        f"-config {GENERATED_CONFIG_FILE_PATH}",
        f"-profile {GAME_PROFILE_DIRECTORY}",
        f"-addonDownloadDir {WORKSHOP_DIR}",
        f"-addonsDir {WORKSHOP_DIR}",
    ] + list(resolved_game_arguments.values())
)
print(launch, flush=True)
os.system(launch)