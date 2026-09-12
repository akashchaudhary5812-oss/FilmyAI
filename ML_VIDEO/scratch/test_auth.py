"""Authenticate with OpenDataLab and inspect MovieNet file structure."""
import os
from pathlib import Path

# Load credentials from .env
def load_env(env_path):
    env = {}
    for line in Path(env_path).read_text().strip().splitlines():
        line = line.strip()
        if line and '=' in line and not line.startswith('#'):
            k, v = line.split('=', 1)
            env[k.strip()] = v.strip().strip('"').strip("'")
    return env

env = load_env('ML_VIDEO/.env')
AK = env.get('ACCESS_KEY_OPENDATALAB', '')
SK = env.get('SECREST_KEY_OPENDATALAB', '')

print(f"AK loaded: {'*' * 8}{AK[-4:] if AK else 'MISSING'}")
print(f"SK loaded: {'*' * 8}{SK[-4:] if SK else 'MISSING'}")

import openxlab
openxlab.login(ak=AK, sk=SK)
print("Login successful!")

# Now inspect the dataset structure
from openxlab.dataset import info
print("\n=== MovieNet Dataset Info ===")
info('OpenDataLab/MovieNet')
