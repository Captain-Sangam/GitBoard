import json
import os

import boto3

SECRET_NAME = os.environ.get("SECRET_NAME", "gitboard-job")
REGION = os.environ.get("AWS_REGION", "us-west-2")

_cache = None


def get_secrets():
    global _cache
    if _cache is not None:
        return _cache

    client = boto3.client("secretsmanager", region_name=REGION)
    resp = client.get_secret_value(SecretId=SECRET_NAME)
    _cache = json.loads(resp["SecretString"])
    return _cache


def get_secret(key):
    return get_secrets()[key]
