#!/usr/bin/env python3
"""Upload multiple local files to VPS preserving relative paths."""
import sys
from pathlib import Path
import paramiko

HOST = "103.97.127.199"
PORT = 2018
USER = "root"
PASSWORD = "szatRZq9GM"
BASE_REMOTE = "/var/www/VNDC_HUB"


def upload_files(pairs):
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, port=PORT, username=USER, password=PASSWORD, timeout=30)
    sftp = client.open_sftp()
    for local, remote in pairs:
        print(f"Upload {local} -> {remote}")
        sftp.put(local, remote)
    sftp.close()
    client.close()


if __name__ == "__main__":
    root = Path("D:/VNDC_Hub")
    files = [
        "vndc-hub/src/utils/api.js",
        "vndc-hub/src/pages/LibraryPage.jsx",
        "vndc-hub/src/pages/VideosPage.jsx",
        "vndc-hub/src/pages/FormsPage.jsx",
        "vndc-hub/src/pages/UpdatesPage.jsx",
        "vndc-hub/src/components/ui/DocumentViewer.jsx",
    ]
    pairs = [(str(root / f), f"{BASE_REMOTE}/{f.replace(chr(92), '/')}") for f in files]
    upload_files(pairs)
    print("All frontend files uploaded.")
