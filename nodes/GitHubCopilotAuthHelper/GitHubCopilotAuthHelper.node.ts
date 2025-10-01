import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from "n8n-workflow";

/**
 * GitHub Copilot Auth Helper Node
 * Generates an interactive HTML page for OAuth Device Flow authentication
 * User opens the page in browser, follows the flow, and gets the token
 */
export class GitHubCopilotAuthHelper implements INodeType {
  description: INodeTypeDescription = {
    displayName: "GitHub Copilot Auth Helper",
    name: "githubCopilotAuthHelper",
    icon: "file:../../shared/icons/copilot.svg",
    group: ["transform"],
    version: 1,
    description: "Interactive OAuth Device Flow authentication helper - generates HTML page for easy token generation",
    defaults: {
      name: "GitHub Copilot Auth Helper",
    },
    inputs: ["main"],
    outputs: ["main"],
    properties: [
      {
        displayName: "📋 Como Usar",
        name: "instructions",
        type: "notice",
        default: "",
        description: `
          <div style="background: #e3f2fd; padding: 15px; border-left: 4px solid #2196F3; border-radius: 4px;">
            <h3 style="margin-top: 0;">🎯 Este node gera uma página HTML interativa!</h3>
            <ol>
              <li>Execute este node</li>
              <li>Copie o HTML do output</li>
              <li>Salve como arquivo .html e abra no navegador</li>
              <li>OU use um node "Send Email" para enviar para você</li>
              <li>Siga as instruções na página para obter seu token</li>
            </ol>
            <p><strong>A página faz tudo automaticamente:</strong></p>
            <ul>
              <li>✅ Solicita device code do GitHub</li>
              <li>✅ Mostra código para copiar</li>
              <li>✅ Abre GitHub automaticamente</li>
              <li>✅ Faz polling até você autorizar</li>
              <li>✅ Exibe token pronto para copiar</li>
            </ul>
          </div>
        `,
      },
      {
        displayName: "Client ID",
        name: "clientId",
        type: "string",
        default: "01ab8ac9400c4e429b23",
        required: true,
        description: "GitHub OAuth Client ID (VS Code official)",
      },
      {
        displayName: "Scopes",
        name: "scopes",
        type: "string",
        default: "repo user:email",
        required: true,
        description: "OAuth scopes required for GitHub Copilot",
      },
      {
        displayName: "Output Format",
        name: "outputFormat",
        type: "options",
        options: [
          {
            name: "Complete HTML File",
            value: "html",
            description: "Full HTML page ready to save and open",
          },
          {
            name: "HTML + Instructions",
            value: "htmlWithInstructions",
            description: "HTML with usage instructions",
          },
        ],
        default: "htmlWithInstructions",
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      const clientId = this.getNodeParameter("clientId", i) as string;
      const scopes = this.getNodeParameter("scopes", i) as string;
      const outputFormat = this.getNodeParameter("outputFormat", i) as string;

      // Generate interactive HTML page
      const html = generateAuthPage(clientId, scopes);

      const output: any = {
        html,
        clientId,
        scopes,
      };

      if (outputFormat === "htmlWithInstructions") {
        output.instructions = [
          "1. Copy the HTML content below",
          "2. Save as 'github-copilot-auth.html'",
          "3. Open the file in your browser",
          "4. Follow the on-screen instructions",
          "5. Copy the token when it appears",
          "6. Use the token in your GitHub Copilot OAuth2 credential in n8n",
        ].join("\n");
      }

      returnData.push({
        json: output,
        pairedItem: i,
      });
    }

    return [returnData];
  }
}

/**
 * Generates the complete HTML page for Device Flow authentication
 */
function generateAuthPage(clientId: string, scopes: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GitHub Copilot Authentication</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }
    
    .container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      max-width: 600px;
      width: 100%;
      padding: 40px;
    }
    
    h1 {
      color: #333;
      margin-bottom: 10px;
      font-size: 28px;
    }
    
    .subtitle {
      color: #666;
      margin-bottom: 30px;
      font-size: 14px;
    }
    
    .step {
      background: #f8f9fa;
      border-radius: 12px;
      padding: 25px;
      margin-bottom: 20px;
      border: 2px solid #e9ecef;
    }
    
    .step.active {
      border-color: #667eea;
      background: #f0f4ff;
    }
    
    .step h2 {
      color: #333;
      font-size: 18px;
      margin-bottom: 15px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .step-number {
      background: #667eea;
      color: white;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: bold;
    }
    
    .code-box {
      background: #2d3748;
      color: #fff;
      padding: 20px;
      border-radius: 8px;
      font-size: 32px;
      text-align: center;
      letter-spacing: 8px;
      font-family: 'Courier New', monospace;
      margin: 15px 0;
      user-select: all;
      cursor: pointer;
      transition: all 0.3s;
    }
    
    .code-box:hover {
      background: #1a202c;
      transform: scale(1.02);
    }
    
    .btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 15px 30px;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      width: 100%;
      transition: all 0.3s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }
    
    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
    }
    
    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .status {
      text-align: center;
      margin-top: 30px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
    }
    
    .status h3 {
      color: #333;
      margin-bottom: 15px;
      font-size: 16px;
    }
    
    .spinner {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 0 auto;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .success-box {
      background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);
      padding: 30px;
      border-radius: 12px;
      margin-top: 20px;
    }
    
    .success-box h2 {
      color: #155724;
      margin-bottom: 15px;
    }
    
    .token-display {
      background: white;
      padding: 15px;
      border-radius: 8px;
      word-break: break-all;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      color: #333;
      margin: 15px 0;
      border: 2px solid #28a745;
      max-height: 150px;
      overflow-y: auto;
    }
    
    .error-box {
      background: #f8d7da;
      color: #721c24;
      padding: 20px;
      border-radius: 8px;
      margin-top: 20px;
      border: 2px solid #f5c6cb;
    }
    
    .hidden {
      display: none;
    }
    
    .info-text {
      color: #666;
      font-size: 14px;
      margin-top: 10px;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 GitHub Copilot Authentication</h1>
    <p class="subtitle">OAuth Device Flow - Obtenha seu token de autenticação</p>
    
    <div id="step1" class="step active">
      <h2><span class="step-number">1</span> Iniciar Autenticação</h2>
      <button class="btn" onclick="startDeviceFlow()">
        <span>▶️</span>
        <span>Começar</span>
      </button>
      <p class="info-text">
        Clique para solicitar um código de autorização do GitHub
      </p>
    </div>
    
    <div id="step2" class="step hidden">
      <h2><span class="step-number">2</span> Copie o Código</h2>
      <div class="code-box" id="userCode" onclick="copyCode()">
        Carregando...
      </div>
      <button class="btn" onclick="copyCode()">
        <span>📋</span>
        <span>Copiar Código</span>
      </button>
      <p class="info-text">
        Clique no código ou no botão para copiar
      </p>
    </div>
    
    <div id="step3" class="step hidden">
      <h2><span class="step-number">3</span> Autorize no GitHub</h2>
      <button class="btn" onclick="openGitHub()">
        <span>🌐</span>
        <span>Abrir GitHub</span>
      </button>
      <p class="info-text">
        Cole o código copiado e autorize a aplicação
      </p>
    </div>
    
    <div id="statusSection" class="status hidden">
      <h3>Status: <span id="statusText">Aguardando...</span></h3>
      <div id="spinner" class="spinner"></div>
    </div>
    
    <div id="successSection" class="success-box hidden">
      <h2>✅ Token Obtido com Sucesso!</h2>
      <p>Copie o token abaixo e use na credencial n8n:</p>
      <div class="token-display" id="tokenDisplay"></div>
      <button class="btn" onclick="copyToken()">
        <span>📋</span>
        <span>Copiar Token</span>
      </button>
      <p class="info-text" style="color: #155724; margin-top: 15px;">
        ✨ Cole este token na credencial "GitHub Copilot OAuth2 (with Helper)" no n8n
      </p>
    </div>
    
    <div id="errorSection" class="error-box hidden">
      <h3>❌ Erro</h3>
      <p id="errorText"></p>
    </div>
  </div>
  
  <script>
    const CLIENT_ID = "${clientId}";
    const SCOPES = "${scopes}";
    const DEVICE_CODE_URL = "https://github.com/login/device/code";
    const ACCESS_TOKEN_URL = "https://github.com/login/oauth/access_token";
    
    let deviceCode = "";
    let userCode = "";
    let verificationUri = "";
    let accessToken = "";
    
    async function startDeviceFlow() {
      try {
        document.getElementById("step1").querySelector(".btn").disabled = true;
        document.getElementById("step1").querySelector(".btn").innerHTML = '<span>⏳</span><span>Solicitando...</span>';
        
        // Request device code
        const response = await fetch(DEVICE_CODE_URL, {
          method: "POST",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            client_id: CLIENT_ID,
            scope: SCOPES
          })
        });
        
        if (!response.ok) {
          throw new Error(\`Erro ao solicitar device code: \${response.status}\`);
        }
        
        const data = await response.json();
        deviceCode = data.device_code;
        userCode = data.user_code;
        verificationUri = data.verification_uri_complete || data.verification_uri;
        
        // Show step 2
        document.getElementById("step1").classList.remove("active");
        document.getElementById("step2").classList.remove("hidden");
        document.getElementById("step2").classList.add("active");
        document.getElementById("userCode").textContent = userCode;
        
        // Show step 3
        document.getElementById("step3").classList.remove("hidden");
        document.getElementById("step3").classList.add("active");
        
      } catch (error) {
        showError(error.message);
      }
    }
    
    function copyCode() {
      navigator.clipboard.writeText(userCode);
      const btn = document.getElementById("step2").querySelector(".btn");
      const originalText = btn.innerHTML;
      btn.innerHTML = '<span>✅</span><span>Copiado!</span>';
      setTimeout(() => {
        btn.innerHTML = originalText;
      }, 2000);
    }
    
    function openGitHub() {
      window.open(verificationUri, "_blank");
      startPolling();
    }
    
    async function startPolling() {
      document.getElementById("statusSection").classList.remove("hidden");
      document.getElementById("statusText").textContent = "Verificando autorização...";
      
      const maxAttempts = 180; // 15 minutes
      let interval = 5000; // 5 seconds
      
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        await sleep(interval);
        
        document.getElementById("statusText").textContent = \`Verificando... (tentativa \${attempt}/\${maxAttempts})\`;
        
        try {
          const response = await fetch(ACCESS_TOKEN_URL, {
            method: "POST",
            headers: {
              "Accept": "application/json",
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              client_id: CLIENT_ID,
              device_code: deviceCode,
              grant_type: "urn:ietf:params:oauth:grant-type:device_code"
            })
          });
          
          const data = await response.json();
          
          if (data.access_token) {
            accessToken = data.access_token;
            showSuccess();
            return;
          }
          
          if (data.error === "authorization_pending") {
            continue;
          }
          
          if (data.error === "slow_down") {
            interval += 5000; // Increase interval by 5 seconds
            continue;
          }
          
          if (data.error === "expired_token") {
            throw new Error("Código expirado. Por favor, recomece o processo.");
          }
          
          if (data.error === "access_denied") {
            throw new Error("Autorização negada pelo usuário.");
          }
          
          if (data.error) {
            throw new Error(\`Erro OAuth: \${data.error}\`);
          }
          
        } catch (error) {
          showError(error.message);
          return;
        }
      }
      
      showError("Tempo esgotado. A autorização demorou muito. Por favor, tente novamente.");
    }
    
    function showSuccess() {
      document.getElementById("statusSection").classList.add("hidden");
      document.getElementById("successSection").classList.remove("hidden");
      document.getElementById("tokenDisplay").textContent = accessToken;
      
      // Scroll to success section
      document.getElementById("successSection").scrollIntoView({ behavior: "smooth" });
    }
    
    function showError(message) {
      document.getElementById("statusSection").classList.add("hidden");
      document.getElementById("errorSection").classList.remove("hidden");
      document.getElementById("errorText").textContent = message;
    }
    
    function copyToken() {
      navigator.clipboard.writeText(accessToken);
      const btn = document.getElementById("successSection").querySelector(".btn");
      const originalText = btn.innerHTML;
      btn.innerHTML = '<span>✅</span><span>Token Copiado!</span>';
      setTimeout(() => {
        btn.innerHTML = originalText;
      }, 2000);
    }
    
    function sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
  </script>
</body>
</html>`;
}
