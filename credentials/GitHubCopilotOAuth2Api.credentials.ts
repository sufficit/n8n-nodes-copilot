import {
  ICredentialType,
  INodeProperties,
  ICredentialTestRequest,
  IAuthenticateGeneric,
} from "n8n-workflow";

import { GITHUB_COPILOT_API } from "../shared/utils/GitHubCopilotEndpoints";

/**
 * GitHub Copilot OAuth2 Credentials - Interface Direta e Funcional
 * Com instruções claras e links diretos para Device Flow
 */

export class GitHubCopilotOAuth2Api implements ICredentialType {
  name = "githubCopilotOAuth2Api";

  displayName = "GitHub Copilot OAuth2 (with Helper)";

  documentationUrl =
    "https://docs.github.com/en/copilot/github-copilot-chat/copilot-chat-in-ides/using-github-copilot-chat-in-your-ide";

  properties: INodeProperties[] = [
    {
      displayName: "🎯 Como obter seu token",
      name: "authMethod",
      type: "options",
      options: [
        {
          name: "🚀 Script Automático (RECOMENDADO)",
          value: "script",
          description: "Execute: node get-copilot-token.js no terminal",
        },
        {
          name: "🔧 OAuth Manual no GitHub",
          value: "manual",
          description: "Processo manual no site do GitHub",
        },
        {
          name: "📋 Já tenho o token",
          value: "have_token",
          description: "Pular instruções e inserir token",
        },
      ],
      default: "script",
      description: "Escolha como quer obter seu token GitHub Copilot",
    },
    {
      displayName: "🚀 Execute o Script Automático",
      name: "scriptInstructions",
      type: "notice",
      default: "",
      displayOptions: {
        show: {
          authMethod: ["script"],
        },
      },
      description: `<div style="background: #e8f5e8; padding: 15px; border: 2px solid #4CAF50; border-radius: 8px;">
			<strong style="color: #2E7D32; font-size: 16px;">📋 SCRIPT AUTOMÁTICO (MAIS FÁCIL)</strong><br/><br/>
			<strong>1. Abra o terminal:</strong><br/>
			<code style="background: #f0f0f0; padding: 8px; border-radius: 4px; display: block; margin: 8px 0;">cd z:\\Desenvolvimento\\n8n-nodes-copilot</code><br/>
			<strong>2. Execute o script:</strong><br/>
			<code style="background: #f0f0f0; padding: 8px; border-radius: 4px; display: block; margin: 8px 0;">node get-copilot-token.js</code><br/>
			<strong>3. Siga as instruções:</strong><br/>
			• O script abre o navegador automaticamente<br/>
			• Faça login no GitHub se necessário<br/>
			• Autorize a aplicação<br/>
			• O token será exibido no terminal<br/><br/>
			<strong>4. Copie o token e cole no campo abaixo</strong>
			</div>`,
    },
    {
      displayName: "🔧 OAuth Manual no GitHub",
      name: "manualInstructions",
      type: "notice",
      default: "",
      displayOptions: {
        show: {
          authMethod: ["manual"],
        },
      },
      description: `<div style="background: #fff3e0; padding: 15px; border: 2px solid #FF9800; border-radius: 8px;">
			<strong style="color: #E65100; font-size: 16px;">📋 PROCESSO MANUAL</strong><br/><br/>
			<strong>1. Abra esta URL:</strong><br/>
			<a href="https://github.com/login/device" target="_blank" style="background: #2196F3; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 8px 0;">🌐 CLIQUE AQUI - GitHub Device Flow</a><br/><br/>
			<strong>2. Cole este Client ID:</strong><br/>
			<code style="background: #f0f0f0; padding: 8px; border-radius: 4px; display: block; margin: 8px 0; font-size: 14px;">01ab8ac9400c4e429b23</code><br/>
			<strong>3. Cole estes Scopes:</strong><br/>
			<code style="background: #f0f0f0; padding: 8px; border-radius: 4px; display: block; margin: 8px 0;">repo user:email</code><br/>
			<strong>4. Processo:</strong><br/>
			• GitHub gera código de 8 caracteres<br/>
			• Autorize a aplicação<br/>
			• Copie o token final<br/><br/>
			<strong>5. Cole o token no campo abaixo</strong>
			</div>`,
    },
    {
      displayName: "GitHub Copilot Token",
      name: "token",
      type: "string",
      typeOptions: {
        password: true,
      },
      default: "",
      required: true,
      description: "🔑 Cole aqui seu token GitHub Copilot (formato: gho_*)",
      placeholder: "gho_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: "generic",
    properties: {
      headers: {
        Authorization: "=Bearer {{$credentials.token}}",
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": "GitHub-Copilot-Chat/1.0.0 VSCode/1.85.0",
        "Editor-Version": "vscode/1.85.0",
        "Editor-Plugin-Version": "copilot-chat/0.12.0",
        "X-GitHub-Api-Version": "2025-04-01",
      },
    },
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: GITHUB_COPILOT_API.BASE_URL,
      url: GITHUB_COPILOT_API.ENDPOINTS.MODELS,
      method: "GET",
    },
  };
}
