#!/usr/bin/env python3
"""Upload directory to VPS via SFTP."""
import os
import sys
from pathlib import Path
import paramiko

HOST = "103.97.127.199"
PORT = 2018
USER = "root"
PASSWORD = "szatRZq9GM"


def upload_dir(local_dir: str, remote_dir: str):
    local = Path(local_dir)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, port=PORT, username=USER, password=PASSWORD, timeout=30)
    sftp = client.open_sftp()

    def ensure_remote(path: str):
        parts = path.strip("/").split("/")
        cur = ""
        for p in parts:
            cur += "/" + p
            try:
                sftp.stat(cur)
            except FileNotFoundError:
                sftp.mkdir(cur)

    ensure_remote(remote_dir)
    count = 0
    for item in local.iterdir():
        if item.is_file():
            remote_path = f"{remote_dir.rstrip('/')}/{item.name}"
            print(f"Uploading {item.name} ({item.stat().st_size} bytes)...")
            sftp.put(str(item), remote_path)
            count += 1
    sftp.close()
    client.close()
    print(f"Done: {count} files uploaded to {remote_dir}")


if __name__ == "__main__":
    upload_dir(sys.argv[1], sys.argv[2])
