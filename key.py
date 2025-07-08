import requests
import argparse
import configparser
import json
import os

parser = argparse.ArgumentParser(description="Call Decrypt API")
parser.add_argument("--password", required=True, help="The password for decryption")
args = parser.parse_args()

config = configparser.ConfigParser()
config.read("config.ini")

API_KEY = config["openai"]["api_key"]
decrypt_url = "http://localhost:1212/decrypt"

data = {
    "encrypted_key": API_KEY,
    "password": args.password
}

response = requests.post(decrypt_url, headers={"Content-Type": "application/json"}, data=json.dumps(data))
if response.status_code == 200:
    OPENAI_API_KEY = response.json().get("key")
else:
    OPENAI_API_KEY = ""

os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY