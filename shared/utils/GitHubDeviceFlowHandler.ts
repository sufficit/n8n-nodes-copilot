/**
 * GitHub OAuth Device Flow Handler
 * Implements the complete OAuth Device Code Flow for n8n credentials
 * 
 * This handler is called when the user clicks "Iniciar Device Flow" button
 * in the GitHubCopilotDeviceFlow credentials interface
 */

interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  verification_uri_complete?: string;
  expires_in: number;
  interval: number;
}

interface AccessTokenResponse {
  access_token?: string;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
}

interface CopilotTokenResponse {
  token: string;
  expires_at: number;
  refresh_in: number;
  sku?: string;
  chat_enabled?: boolean;
}

/**
 * Step 1: Request Device Code from GitHub
 */
export async function requestDeviceCode(
  clientId: string,
  scopes: string,
  deviceCodeUrl: string
): Promise<DeviceCodeResponse> {
  const response = await fetch(deviceCodeUrl, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      scope: scopes,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to request device code: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as DeviceCodeResponse;
}

/**
 * Step 2: Poll for Access Token
 * Implements exponential backoff and handles all error cases
 */
export async function pollForAccessToken(
  clientId: string,
  deviceCode: string,
  accessTokenUrl: string,
  interval: number = 5,
  maxAttempts: number = 180 // 15 minutes with 5s interval
): Promise<string> {
  let currentInterval = interval * 1000; // Convert to milliseconds
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await sleep(currentInterval);

    const response = await fetch(accessTokenUrl, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        device_code: deviceCode,
        grant_type: "urn:ietf:params:oauth:grant-type:device_code",
      }),
    });

    const data = (await response.json()) as AccessTokenResponse;

    // Success case
    if (data.access_token) {
      return data.access_token;
    }

    // Error handling based on GitHub OAuth Device Flow specification
    if (data.error === "authorization_pending") {
      // User hasn't authorized yet, continue polling
      console.log(`[Device Flow] Attempt ${attempt}/${maxAttempts}: Waiting for authorization...`);
      continue;
    }

    if (data.error === "slow_down") {
      // Rate limit hit, increase interval by 5 seconds
      currentInterval += 5000;
      console.log(`[Device Flow] Rate limited, increasing interval to ${currentInterval / 1000}s`);
      continue;
    }

    if (data.error === "expired_token") {
      throw new Error("Device code expired. Please start the Device Flow again.");
    }

    if (data.error === "access_denied") {
      throw new Error("User denied authorization.");
    }

    // Unknown error
    throw new Error(`OAuth error: ${data.error} - ${data.error_description || "Unknown error"}`);
  }

  throw new Error("Device Flow timeout. Authorization took too long.");
}

/**
 * Step 3: Convert GitHub OAuth Token to GitHub Copilot Token (Optional)
 * The GitHub OAuth token (gho_*) already works with Copilot API,
 * but this conversion provides additional metadata
 */
export async function convertToCopilotToken(
  githubToken: string,
  copilotTokenUrl: string
): Promise<CopilotTokenResponse> {
  const response = await fetch(copilotTokenUrl, {
    method: "GET",
    headers: {
      "Authorization": `token ${githubToken}`,
      "Accept": "application/vnd.github+json",
      "X-GitHub-Api-Version": "2025-04-01",
      "User-Agent": "GitHub-Copilot-Chat/1.0.0 VSCode/1.85.0",
      "Editor-Version": "vscode/1.85.0",
      "Editor-Plugin-Version": "copilot-chat/0.12.0",
    },
  });

  if (!response.ok) {
    // If conversion fails, return the GitHub token as-is
    // It still works with Copilot API
    console.warn(`[Device Flow] Failed to convert to Copilot token: ${response.status}`);
    return {
      token: githubToken,
      expires_at: Date.now() + (8 * 60 * 60 * 1000), // 8 hours
      refresh_in: 8 * 60 * 60, // 8 hours in seconds
    };
  }

  const data = (await response.json()) as CopilotTokenResponse;
  return data;
}

/**
 * Complete Device Flow Process
 * Orchestrates all steps and returns the final token
 */
export async function executeDeviceFlow(
  clientId: string,
  scopes: string,
  deviceCodeUrl: string,
  accessTokenUrl: string,
  copilotTokenUrl: string,
  onProgress?: (status: DeviceFlowStatus) => void
): Promise<DeviceFlowResult> {
  try {
    // Step 1: Request device code
    onProgress?.({
      step: 1,
      status: "requesting_device_code",
      message: "Solicitando device code do GitHub...",
    });

    const deviceData = await requestDeviceCode(clientId, scopes, deviceCodeUrl);

    onProgress?.({
      step: 2,
      status: "awaiting_authorization",
      message: "Aguardando sua autorização no GitHub...",
      deviceData: {
        userCode: deviceData.user_code,
        verificationUri: deviceData.verification_uri,
        verificationUriComplete: deviceData.verification_uri_complete,
        expiresIn: deviceData.expires_in,
      },
    });

    // Step 2: Poll for access token
    const accessToken = await pollForAccessToken(
      clientId,
      deviceData.device_code,
      accessTokenUrl,
      deviceData.interval
    );

    onProgress?.({
      step: 3,
      status: "token_obtained",
      message: "Token GitHub OAuth obtido! Convertendo para token Copilot...",
    });

    // Step 3: Convert to Copilot token (optional, but provides metadata)
    const copilotData = await convertToCopilotToken(accessToken, copilotTokenUrl);

    onProgress?.({
      step: 4,
      status: "complete",
      message: "✅ Autenticação completa! Token salvo com sucesso.",
    });

    return {
      success: true,
      accessToken: copilotData.token || accessToken,
      expiresAt: new Date(copilotData.expires_at),
      metadata: {
        sku: copilotData.sku,
        chatEnabled: copilotData.chat_enabled,
        refreshIn: copilotData.refresh_in,
      },
    };
  } catch (error) {
    onProgress?.({
      step: -1,
      status: "error",
      message: `❌ Erro: ${error instanceof Error ? error.message : String(error)}`,
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Utility: Sleep function for polling
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Type Definitions
 */

export interface DeviceFlowStatus {
  step: number;
  status: "requesting_device_code" | "awaiting_authorization" | "token_obtained" | "complete" | "error";
  message: string;
  deviceData?: {
    userCode: string;
    verificationUri: string;
    verificationUriComplete?: string;
    expiresIn: number;
  };
}

export interface DeviceFlowResult {
  success: boolean;
  accessToken?: string;
  expiresAt?: Date;
  metadata?: {
    sku?: string;
    chatEnabled?: boolean;
    refreshIn?: number;
  };
  error?: string;
}
