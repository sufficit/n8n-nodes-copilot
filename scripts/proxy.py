"""
GitHub Copilot Request Interceptor using mitmproxy

Purpose: Capture OAuth, HMAC, and metadata headers from VS Code Copilot requests

Installation:
    pip install mitmproxy

Usage:
    1. Run: mitmdump -s scripts/proxy.py --ssl-insecure
    2. Install mitmproxy CA certificate (follow terminal instructions)
    3. Configure VS Code proxy: http://localhost:8080
    4. Use Copilot Chat in VS Code
    5. Check temp/mitm-captured-*.json files

Features:
    - Captures all GitHub Copilot API requests
    - Extracts OAuth tokens, HMAC signatures, metadata headers
    - Saves separate files for embeddings vs chat requests
    - Pretty-prints important authentication details
"""

from mitmproxy import http
import json
from datetime import datetime
import os

class CopilotInterceptor:
    def __init__(self):
        self.embeddings_requests = []
        self.chat_requests = []
        self.other_requests = []
        
    def request(self, flow: http.HTTPFlow) -> None:
        """Intercept outgoing requests"""
        
        # Only process GitHub Copilot requests
        if 'githubcopilot.com' not in flow.request.pretty_host and \
           'api.github.com' not in flow.request.pretty_host:
            return
            
        print("\n" + "="*80)
        print(f"🔍 INTERCEPTED: {flow.request.method} {flow.request.pretty_url}")
        print("="*80)
        
        # Extract important headers
        auth_headers = {}
        for header_name in flow.request.headers:
            header_lower = header_name.lower()
            if any(keyword in header_lower for keyword in 
                   ['auth', 'hmac', 'github', 'editor', 'machine', 'session', 'client']):
                auth_headers[header_name] = flow.request.headers[header_name]
                print(f"🔑 {header_name}: {flow.request.headers[header_name][:50]}...")
        
        # Parse request body
        request_body = None
        if flow.request.content:
            try:
                request_body = json.loads(flow.request.content.decode('utf-8'))
                print(f"\n📨 Request Body Preview:")
                print(json.dumps(request_body, indent=2)[:500])
            except:
                pass
        
        # Store request data
        request_data = {
            'timestamp': datetime.now().isoformat(),
            'method': flow.request.method,
            'url': flow.request.pretty_url,
            'host': flow.request.pretty_host,
            'path': flow.request.path,
            'auth_headers': auth_headers,
            'all_headers': dict(flow.request.headers),
            'body': request_body
        }
        
        # Categorize request
        if '/embeddings' in flow.request.path:
            self.embeddings_requests.append(request_data)
            print("📂 Category: EMBEDDINGS")
        elif '/chat/completions' in flow.request.path:
            self.chat_requests.append(request_data)
            print("📂 Category: CHAT")
        else:
            self.other_requests.append(request_data)
            print("📂 Category: OTHER")
    
    def response(self, flow: http.HTTPFlow) -> None:
        """Intercept incoming responses"""
        
        if 'githubcopilot.com' not in flow.request.pretty_host and \
           'api.github.com' not in flow.request.pretty_host:
            return
        
        print(f"\n📥 Response Status: {flow.response.status_code}")
        
        # Parse response body
        if flow.response.content:
            try:
                response_body = json.loads(flow.response.content.decode('utf-8'))
                print(f"📨 Response Body Preview:")
                print(json.dumps(response_body, indent=2)[:500])
            except:
                pass
        
        # Save all captured data
        self._save_data()
    
    def _save_data(self):
        """Save captured requests to JSON files"""
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        if self.embeddings_requests:
            filename = f'./temp/mitm-captured-embeddings-{timestamp}.json'
            with open(filename, 'w') as f:
                json.dump(self.embeddings_requests, f, indent=2)
            print(f"\n💾 Saved {len(self.embeddings_requests)} embeddings requests to: {filename}")
        
        if self.chat_requests:
            filename = f'./temp/mitm-captured-chat-{timestamp}.json'
            with open(filename, 'w') as f:
                json.dump(self.chat_requests, f, indent=2)
            print(f"💾 Saved {len(self.chat_requests)} chat requests to: {filename}")
        
        if self.other_requests:
            filename = f'./temp/mitm-captured-other-{timestamp}.json'
            with open(filename, 'w') as f:
                json.dump(self.other_requests, f, indent=2)
            print(f"💾 Saved {len(self.other_requests)} other requests to: {filename}")

addons = [CopilotInterceptor()]
