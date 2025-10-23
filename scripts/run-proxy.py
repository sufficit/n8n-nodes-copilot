#!/usr/bin/env python3
"""
GitHub Copilot Proxy Runner

Convenience script to run mitmdump with the Copilot interceptor

Usage:
    python scripts/run-proxy.py                    # No filter (capture all)
    python scripts/run-proxy.py --filter chat     # Only chat requests
    python scripts/run-proxy.py --filter attachment # Only attachment requests
    python scripts/run-proxy.py --filter embeddings # Only embeddings requests
"""

import subprocess
import sys
import os
import socket

def is_port_available(port):
    """Check if a port is available"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.bind(('', port))
            return True
        except OSError:
            return False

def find_available_port(start_port=8080, max_attempts=10):
    """Find an available port starting from start_port"""
    for port in range(start_port, start_port + max_attempts):
        if is_port_available(port):
            return port
    return None

def main():
    # Find available port
    port = find_available_port()
    if port is None:
        print("❌ No available ports found in range 8080-8089")
        sys.exit(1)

    # Build command
    cmd = ['mitmdump', '-s', 'scripts/proxy.py', '--ssl-insecure', f'--mode', f'regular@{port}']

    # Add filter if provided
    if len(sys.argv) > 1 and sys.argv[1] == '--filter' and len(sys.argv) > 2:
        filter_text = sys.argv[2]
        cmd.extend(['--set', f'filter={filter_text}'])
        print(f"🎯 Starting proxy with filter: '{filter_text}' on port {port}")
    else:
        print(f"🎯 Starting proxy without filter (capturing all) on port {port}")

    print("📋 Command:", ' '.join(cmd))
    print("\n📋 Setup Instructions:")
    print(f"1. Install mitmproxy CA certificate (follow terminal instructions)")
    print(f"2. Configure VS Code proxy: http://localhost:{port}")
    print("3. Use Copilot Chat in VS Code")
    print("4. Check temp/mitm-captured-*.json files")
    print("\n" + "="*60)

    try:
        # Run mitmdump
        print(f"🚀 Executing: {' '.join(cmd)}")
        result = subprocess.run(cmd, check=True, capture_output=True, text=True)
        print("✅ Proxy started successfully")
    except subprocess.CalledProcessError as e:
        print(f"\n❌ Error running proxy: {e}")
        print(f"Return code: {e.returncode}")
        if e.stdout:
            print(f"STDOUT: {e.stdout}")
        if e.stderr:
            print(f"STDERR: {e.stderr}")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n\n🛑 Proxy stopped by user")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()