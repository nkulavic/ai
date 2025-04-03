# Remote MCP Server with GitHub OAuth

A production-ready Model Context Protocol (MCP) server implementation that provides authenticated access to GitHub API functionality through OAuth. Built on Cloudflare Workers, this server enables AI agents to interact with GitHub securely while maintaining state and authentication.

## Overview

This Remote MCP Server implements the Model Context Protocol (MCP) to expose GitHub API functionality as tools that AI agents can discover and use. It combines:
- Cloudflare Workers for serverless deployment
- GitHub OAuth for secure authentication
- MCP for standardized AI agent communication
- TypeScript for type safety
- Zod for runtime validation

## Core Architecture

### 1. MCP Agent Implementation

```typescript
import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

type Props = {
    login: string;
    name: string;
    email: string;
    accessToken: string;
};

type Env = {
    AI: Ai;
    // Add other bindings as needed
};

export class MyMCP extends McpAgent<Props, Env> {
    server = new McpServer({
        name: "Github OAuth Proxy Demo",
        version: "1.0.0",
    });

    async init() {
        // Register tools
        registerAddTool(this.server);
        registerUserInfoOctokitTool(this.server, this.props);
        registerGitHubTools(this.server, this.env, this.props);
        
        // Register tool discovery
        this.registerToolDiscovery();
    }
}
```

### 2. OAuth Integration

```typescript
import OAuthProvider from "@cloudflare/workers-oauth-provider";

export default new OAuthProvider({
    apiRoute: "/sse",
    apiHandler: MyMCP.mount('/sse'),
    defaultHandler: GitHubHandler,
    authorizeEndpoint: "/authorize",
    tokenEndpoint: "/token",
    clientRegistrationEndpoint: "/register",
});
```

## Available Tools

### 1. GitHub Repository Tools
- `getRepository`: Repository metadata
- `listMyRepos`: Authenticated user's repositories
- `getRepoContents`: Repository file structure
- `getRepoReadme`: Repository README
- `getRepoFileContent`: File contents

### 2. Issue & PR Management
- `listIssues`: Repository issues
- `createIssue`: New issue creation
- `getIssue`: Issue details
- `createComment`: Comment creation
- `updateIssueState`: Issue state updates
- `listPullRequests`: PR listing
- `getPullRequest`: PR details

### 3. Search Functionality
- `searchGitHubCode`: Code search
- `searchIssuesAndPRs`: Issues/PRs search
- `searchRepositories`: Repository search
- `searchCommits`: Commit search
- `searchUsers`: User/org search
- `searchGitHub`: Unified search

### 4. Repository Management
- `listBranches`: Branch listing
- `getBranch`: Branch details
- `listTags`: Tag listing
- `listCommits`: Commit history
- `getCommit`: Commit details

### 5. User Operations
- `userInfoOctokit`: User information
- `createGist`: Gist creation

## Implementation Guide

### 1. Setup Project

```bash
# Install dependencies
npm install @modelcontextprotocol/sdk @cloudflare/workers-oauth-provider zod

# Create KV namespace
npx wrangler kv namespace create OAUTH_KV
```

### 2. Configure Environment

```toml
# wrangler.toml
name = "remote-mcp-server"
main = "src/index.ts"

[vars]
GITHUB_CLIENT_ID = "your_client_id"
GITHUB_CLIENT_SECRET = "your_client_secret"

[[kv_namespaces]]
binding = "OAUTH_KV"
id = "your_kv_namespace_id"
```

### 3. Implement Tool Registration

```typescript
// tools/github/index.ts
export function registerGitHubTools(
    server: McpServer,
    env: Env,
    props: Props | null
) {
    if (!props?.accessToken) return;

    const octokit = new Octokit({
        auth: props.accessToken
    });

    // Register repository tools
    server.tool(
        "getRepository",
        "Get details for a specific repository",
        z.object({
            owner: z.string(),
            repo: z.string(),
        }),
        async ({ owner, repo }) => {
            const response = await octokit.rest.repos.get({
                owner,
                repo,
            });
            return { result: response.data };
        }
    );

    // Register other tools...
}
```

### 4. Tool Discovery Implementation

```typescript
private registerToolDiscovery() {
    this.server.tool(
        "listAvailableTools",
        "Lists all available tools and their descriptions",
        {},
        async () => {
            const toolInfo = [
                { name: "add", description: "Add two numbers" },
                { name: "userInfoOctokit", description: "Get user info from GitHub" },
                // ... other tools
            ];
            
            return {
                content: [{
                    type: "text",
                    text: toolInfo.map(t => 
                        `${t.name}: ${t.description}`
                    ).join('\n')
                }]
            };
        }
    );
}
```

## Integration Examples

### 1. With Claude Desktop

```json
{
    "mcpServers": {
        "github": {
            "command": "npx",
            "args": [
                "mcp-remote",
                "https://your-worker.workers.dev/sse"
            ]
        }
    }
}
```

### 2. With MCP Inspector

```bash
# Install and run inspector
npx @modelcontextprotocol/inspector

# Connect to your server
# URL: http://localhost:8787/sse (local)
# or https://your-worker.workers.dev/sse (production)
```

## Security Considerations

### 1. Authentication Flow
- OAuth token management
- Secure session handling
- Token scope limitations

### 2. Error Handling
```typescript
try {
    const response = await octokit.rest.repos.get({
        owner,
        repo,
    });
    return { result: response.data };
} catch (error) {
    console.error(`Error in getRepository:`, error);
    return {
        error: `Failed to get repository: ${
            error instanceof Error ? error.message : String(error)
        }`
    };
}
```

### 3. Rate Limiting
- GitHub API rate limit handling
- Worker request limits
- Concurrent request management

## Debugging

### 1. Local Development
```bash
# Run locally
npm run dev

# Test MCP connection
npx mcp-remote http://localhost:8787/sse

# Clear auth cache if needed
rm -rf ~/.mcp-auth
```

### 2. Production Monitoring
- Worker analytics
- Error logging
- OAuth flow tracking

## Deployment

```bash
# Deploy to Cloudflare
npm run deploy

# Update secrets
npx wrangler secret put GITHUB_CLIENT_SECRET
```

## Contributing

1. Fork repository
2. Create feature branch
3. Implement changes
4. Add tests
5. Submit PR

## Resources

- [MCP Documentation](https://modelcontextprotocol.io/docs)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [GitHub REST API](https://docs.github.com/en/rest)
- [OAuth 2.0 Specification](https://oauth.net/2/)

## License

MIT License - See LICENSE file for details
