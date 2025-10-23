#!/usr/bin/env python3
"""
GitHub Copilot Proxy Test

Quick test to verify proxy setup and token validity

Usage:
    python scripts/test-proxy-setup.py
"""

import requests
import json
import sys
import os

def load_token():
    """Load GitHub Copilot token"""
    try:
        with open('.token', 'r') as f:
            token = f.read().strip()
        if not token.startswith('gho_'):
            print("❌ Invalid token format (must start with gho_)")
            return None
        return token
    except FileNotFoundError:
        print("❌ .token file not found")
        return None

def test_models_endpoint(token):
    """Test models endpoint to verify token works"""
    url = "https://api.githubcopilot.com/models"
    headers = {
        'Authorization': f'Bearer {token}',
        'Accept': 'application/json'
    }

    try:
        print("🔍 Testing models endpoint...")
        response = requests.get(url, headers=headers, timeout=10)

        if response.status_code == 200:
            data = response.json()
            models = data.get('data', [])
            enabled_models = [m for m in models if not m.get('model_picker_enabled') == False]

            print(f"✅ Token valid! Found {len(models)} total models, {len(enabled_models)} enabled")
            return True
        else:
            print(f"❌ Token test failed: {response.status_code} {response.text}")
            return False

    except requests.exceptions.RequestException as e:
        print(f"❌ Connection error: {e}")
        return False

def test_proxy_connection():
    """Test if proxy is running"""
    try:
        # Try to connect to proxy
        proxies = {
            'http': 'http://localhost:8080',
            'https': 'http://localhost:8080'
        }

        print("🔍 Testing proxy connection...")
        response = requests.get('http://httpbin.org/ip', proxies=proxies, timeout=5)

        if response.status_code == 200:
            print("✅ Proxy connection successful")
            return True
        else:
            print(f"⚠️  Proxy responded with status {response.status_code}")
            return False

    except requests.exceptions.RequestException as e:
        print(f"❌ Proxy connection failed: {e}")
        print("💡 Make sure mitmdump is running: python scripts/run-proxy.py")
        return False

def main():
    print("🧪 GitHub Copilot Proxy Setup Test")
    print("="*50)

    # Test 1: Load token
    token = load_token()
    if not token:
        sys.exit(1)

    print(f"✅ Token loaded (format: {token[:10]}...)")

    # Test 2: Token validity
    if not test_models_endpoint(token):
        sys.exit(1)

    # Test 3: Proxy connection
    proxy_ok = test_proxy_connection()

    print("\n" + "="*50)
    if proxy_ok:
        print("🎉 All tests passed! Ready to capture requests.")
        print("\n📋 Next steps:")
        print("1. Keep proxy running in another terminal")
        print("2. Use Copilot Chat in VS Code with proxy configured")
        print("3. Check temp/mitm-captured-*.json for captured requests")
    else:
        print("⚠️  Setup incomplete. Start proxy and re-run test.")
        print("\n💡 Command: python scripts/run-proxy.py --filter attachment")

if __name__ == '__main__':
    main()