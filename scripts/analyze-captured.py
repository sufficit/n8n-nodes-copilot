#!/usr/bin/env python3
"""
GitHub Copilot Request Analyzer

Analyzes captured requests from the proxy interceptor

Usage:
    python scripts/analyze-captured.py
    python scripts/analyze-captured.py --filter attachment
    python scripts/analyze-captured.py --file temp/mitm-captured-chat-20251023_121957.json
"""

import json
import glob
import sys
import os
from datetime import datetime

def load_captured_files():
    """Load all captured request files"""
    files = glob.glob('temp/mitm-captured-*.json')
    files.sort(reverse=True)  # Most recent first

    if not files:
        print("❌ No captured files found in temp/")
        return []

    print(f"📁 Found {len(files)} captured files:")
    for f in files[:5]:  # Show first 5
        print(f"  - {f}")
    if len(files) > 5:
        print(f"  ... and {len(files)-5} more")

    return files

def analyze_requests(requests, filter_text=None):
    """Analyze the captured requests"""
    if not requests:
        print("❌ No requests to analyze")
        return

    print(f"\n📊 Analyzing {len(requests)} requests...")

    # Filter if requested
    if filter_text:
        original_count = len(requests)
        requests = [r for r in requests if filter_text.lower() in str(r).lower()]
        print(f"🔍 Filtered to {len(requests)} requests containing '{filter_text}' (from {original_count})")

    if not requests:
        print("❌ No requests match the filter")
        return

    # Group by method and URL pattern
    endpoints = {}
    methods = {}
    content_types = {}

    for req in requests:
        # Method
        method = req.get('method', 'UNKNOWN')
        methods[method] = methods.get(method, 0) + 1

        # URL pattern (remove query params for grouping)
        url = req.get('url', '')
        url_pattern = url.split('?')[0]
        endpoints[url_pattern] = endpoints.get(url_pattern, 0) + 1

        # Content-Type
        headers = req.get('requestHeaders', {})
        content_type = headers.get('content-type', 'none')
        content_types[content_type] = content_types.get(content_type, 0) + 1

    print(f"\n🔍 REQUEST METHODS:")
    for method, count in sorted(methods.items()):
        print(f"  {method}: {count}")

    print(f"\n🌐 ENDPOINTS HIT:")
    for endpoint, count in sorted(endpoints.items(), key=lambda x: x[1], reverse=True):
        print(f"  {count:3d} - {endpoint}")

    print(f"\n📋 CONTENT TYPES:")
    for ct, count in sorted(content_types.items(), key=lambda x: x[1], reverse=True):
        print(f"  {count:3d} - {ct}")

    # Show sample requests
    print(f"\n📝 SAMPLE REQUESTS:")
    for i, req in enumerate(requests[:3]):
        method = req.get('method', 'UNKNOWN')
        url = req.get('url', '')
        headers = req.get('requestHeaders', {})
        content_type = headers.get('content-type', 'none')

        print(f"\n  {i+1}. {method} {url}")
        print(f"     Content-Type: {content_type}")

        # Show body preview if small
        body = req.get('requestBody', '')
        if body and len(body) < 200:
            print(f"     Body: {body[:100]}{'...' if len(body) > 100 else ''}")

def main():
    import argparse

    parser = argparse.ArgumentParser(description='Analyze captured GitHub Copilot requests')
    parser.add_argument('--filter', help='Filter requests containing this text')
    parser.add_argument('--file', help='Analyze specific file instead of all')
    args = parser.parse_args()

    print("🔍 GitHub Copilot Request Analyzer")
    print("="*50)

    # Load data
    if args.file:
        if not os.path.exists(args.file):
            print(f"❌ File not found: {args.file}")
            sys.exit(1)
        files = [args.file]
    else:
        files = load_captured_files()

    if not files:
        sys.exit(1)

    # Load and combine all requests
    all_requests = []
    for file_path in files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if isinstance(data, list):
                    all_requests.extend(data)
                else:
                    all_requests.append(data)
        except Exception as e:
            print(f"⚠️  Error loading {file_path}: {e}")

    print(f"\n📊 Loaded {len(all_requests)} total requests from {len(files)} files")

    # Analyze
    analyze_requests(all_requests, args.filter)

if __name__ == '__main__':
    main()