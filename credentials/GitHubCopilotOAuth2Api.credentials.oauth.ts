import type { ICredentialType, INodeProperties, ICredentialTestRequest } from "n8n-workflow";

import { GITHUB_COPILOT_API } from "../shared/utils/GitHubCopilotEndpoints";

/**
 * GitHub Copilot OAuth2 Credentials - Device Flow with Pre-filled Data
 * Uses GitHub Device Flow with VS Code Client ID - no user input required
 */
export class GitHubCopilotOAuth2Api implements ICredentialType {
  name = "githubCopilotOAuth2Api";

  extends = ["oAuth2Api"];

  displayName = "GitHub Copilot OAuth2 API";

  documentationUrl = "github";

  properties: INodeProperties[] = [
    {
      displayName: "Grant Type",
      name: "grantType",
      type: "hidden",
      default: "authorizationCode",
    },
    {
      displayName: "Client ID",
      name: "clientId",
      type: "hidden",
      default: "01ab8ac9400c4e429b23", // VS Code Client ID
    },
    {
      displayName: "Client Secret",
      name: "clientSecret",
      type: "hidden",
      default: "", // Not required for Device Flow
    },
    {
      displayName: "Authorization URL",
      name: "authUrl",
      type: "hidden",
      default: "https://github.com/login/oauth/authorize",
      required: true,
    },
    {
      displayName: "Access Token URL",
      name: "accessTokenUrl",
      type: "hidden",
      default: "https://github.com/login/oauth/access_token",
      required: true,
    },
    {
      displayName: "Scope",
      name: "scope",
      type: "hidden",
      default: "repo user:email", // Same as script
    },
    {
      displayName: "Auth URI Query Parameters",
      name: "authQueryParameters",
      type: "hidden",
      default: "",
    },
    {
      displayName: "Authentication",
      name: "authentication",
      type: "hidden",
      default: "header",
    },
  ];

  test: ICredentialTestRequest = {
    request: {
      baseURL: GITHUB_COPILOT_API.GITHUB_BASE_URL,
      url: GITHUB_COPILOT_API.ENDPOINTS.USER_COPILOT,
      headers: {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "n8n-GitHub-Copilot",
      },
    },
  };
}
