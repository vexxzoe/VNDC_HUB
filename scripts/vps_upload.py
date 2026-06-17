#!/usr/bin/env python3
import sys
from pathlib import Path
import paramiko

HOST = "103.97.127.199"
PORT = 2018
USER = "root"
PASSWORD = "szatRZq9GM"


def connect():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, port=PORT, username=USER, password=PASSWORD, timeout=30)
    return client


def upload(local_path: str, remote_path: str):
    client = connect()
    try:
        sftp = client.open_sftp()
        sftp.put(local_path, remote_path)
        sftp.close()
    finally:
        client.close()


def run(cmd: str, timeout: int = 300):
    client = connect()
    try:
        stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
        out = stdout.read().decode()
        err = stderr.read().decode()
        code = stdout.channel.recv_exit_status()
        return code, out, err
    finally:
        client.close()


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: vps_upload.py <local> <remote>")
        sys.exit(1)
    upload(sys.argv[1], sys.argv[2])
    print(f"Uploaded {sys.argv[1]} -> {sys.argv[2]}")
