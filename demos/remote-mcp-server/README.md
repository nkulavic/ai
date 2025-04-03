# Remote MCP Server with GitHub OAuth

*(Created by Nick Kulavic)*

A production-ready Model Context Protocol (MCP) server implementation that provides authenticated access to GitHub API functionality through OAuth. Built on Cloudflare Workers, this server enables AI agents to interact with GitHub securely while maintaining state and authentication.

## Table of Contents

- [Overview](#overview)
- [Features: Available Tools](#features-available-tools)
- [Setup & Configuration](#setup--configuration)
- [Local Development & Testing](#local-development--testing)
- [Deployment](#deployment)
- [Integration Examples](#integration-examples)
- [Example Workflows & Time Savings](#example-workflows--time-savings)
- [Testing Tool Functionality](#testing-tool-functionality)
- [Core Architecture Explained](#core-architecture-explained)
- [OAuth Authentication Flow Explained](#oauth-authentication-flow-explained)
- [Security Considerations](#security-considerations)
- [Debugging](#debugging)
- [Contributing](#contributing)
- [Resources](#resources)
- [License](#license)

## Overview

This Remote MCP Server implements the Model Context Protocol (MCP) to expose GitHub API functionality as tools that AI agents can discover and use. It combines:

- Cloudflare Workers for serverless deployment
- GitHub OAuth for secure authentication via `@cloudflare/workers-oauth-provider`
- MCP for standardized AI agent communication using `@modelcontextprotocol/sdk`
- `agents/mcp` base class for Cloudflare-specific agent structure
- TypeScript for type safety
- Zod for runtime validation of tool parameters

## Features: Available Tools

This server exposes a wide range of GitHub functionalities. Each tool requires specific parameters defined by a Zod schema. Below are examples of how you might invoke these tools using natural language with an integrated AI assistant (like Cursor).

### 1. GitHub Repository Tools

- `getRepositoryGitHub`: Repository metadata
  > *Example: "@GitHub Show me the details for the [owner]/[repo-name] repository."*
- `listMyReposGitHub`: Authenticated user's repositories
  > *Example: "@GitHub List my repositories."*
- `getRepoContentsGitHub`: Repository file structure
  > *Example: "@GitHub What files are in the `src/components` directory of [owner]/[repo-name]?"*
  > *Example: "@GitHub List the contents of the root directory for [owner]/[repo-name]."*
- `getRepoReadmeGitHub`: Repository README
  > *Example: "@GitHub Get the README content for [owner]/[repo-name]."*
- `getRepoFileContentGitHub`: File contents
  > *Example: "@GitHub Show me the content of the `package.json` file in [owner]/[repo-name]."*

### 2. Issue & PR Management

- `listIssuesGitHub`: Repository issues
  > *Example: "@GitHub List the open issues for [owner]/[repo-name]."*
  > *Example: "@GitHub Show me closed issues in [owner]/[repo-name]."*
- `createIssueGitHub`: New issue creation
  > *Example: "@GitHub Create an issue in [owner]/[repo-name] titled '[Issue Title]' with the body '[Issue Description]'."*
- `getIssueGitHub`: Issue details
  > *Example: "@GitHub Get the details for issue number [issue-number] in [owner]/[repo-name]."*
- `createCommentGitHub`: Comment creation
  > *Example: "@GitHub Add a comment to issue #[issue-number] in [owner]/[repo-name] saying '[Your comment text]'."*
- `updateIssueStateGitHub`: Issue state updates
  > *Example: "@GitHub Close issue #[issue-number] in [owner]/[repo-name]."*
  > *Example: "@GitHub Reopen issue #[issue-number] in [owner]/[repo-name]."*
- `listPullRequestsGitHub`: PR listing
  > *Example: "@GitHub List the open pull requests for [owner]/[repo-name]."*
- `getPullRequestGitHub`: PR details
  > *Example: "@GitHub Show me the details for pull request #[pr-number] in [owner]/[repo-name]."*
- `previewPullRequestGitHub`: PR changes preview
  > *Example: "@GitHub Show me a preview of the changes in pull request #[pr-number] in [owner]/[repo-name]."*
  > *Example: "@GitHub What files were changed in PR #[pr-number] in [owner]/[repo-name]?"*

### 3. Search Functionality

- `searchGitHubCode`: Code search
  > *Example: "@GitHub Search code in [owner]/[repo-name] for '[search term]'."*
  > *Example: "@GitHub Find code mentioning 'MyClass' in the `src` directory of [owner]/[repo-name]."*
- `searchIssuesAndPRsGitHub`: Issues/PRs search
  > *Example: "@GitHub Search for issues mentioning '[keyword]' in the [owner]/[repo-name] repository."*
  > *Example: "@GitHub Find open PRs assigned to me in [owner]/[repo-name]."*
- `searchRepositoriesGitHub`: Repository search
  > *Example: "@GitHub Search for repositories named '[repo-keyword]'."*
  > *Example: "@GitHub Find TypeScript repositories owned by [owner]."*
- `searchCommitsGitHub`: Commit search
  > *Example: "@GitHub Search commits in [owner]/[repo-name] with the message '[commit message keyword]'."*
- `searchUsersGitHub`: User/org search
  > *Example: "@GitHub Search for users named '[user name]'."*
- `searchGitHub`: Unified search
  > *Example: "@GitHub Search all of GitHub for '[general search term]'."*
  > *Example: "@GitHub Search for '[term]', focusing on code and issues."*

### 4. Version Control Tools

- `listBranchesGitHub`: Branch listing
  > *Example: "@GitHub List the branches for [owner]/[repo-name]."*
- `getBranchGitHub`: Branch details
  > *Example: "@GitHub Get details about the 'main' branch in [owner]/[repo-name]."*
- `listTagsGitHub`: Tag listing
  > *Example: "@GitHub List the tags for [owner]/[repo-name]."*
- `listCommitsGitHub`: Commit history
  > *Example: "@GitHub Show the 10 most recent commits for [owner]/[repo-name] on the 'develop' branch."*
- `getCommitGitHub`: Commit details
  > *Example: "@GitHub Get the details for commit [commit-sha] in [owner]/[repo-name]."*

### 5. User Operations

- `userInfoOctokit`: User information
  > *Example: "@GitHub Show me my user information."*
- `createGistGitHub`: Gist creation
  > *Example: "@GitHub Create a private Gist named '[filename.ext]' with the content '[your code/text]' and description '[gist description]'."*

### 6. Basic/Meta Tools

- `add`: Add two numbers
  > *Example: "@GitHub Add the numbers [number1] and [number2]."*
- `listAvailableTools`: List all available tools (manual list)
  > *Example: "@GitHub What tools do you have available?"*
  > *Example: "@GitHub List available tools."*

## Setup & Configuration

Follow these steps to set up the server for local development or deployment.

### 1. Prerequisites

*   Clone the repository containing this project.
*   Install Node.js and npm.
*   Install project dependencies:
    ```bash
    npm install @modelcontextprotocol/sdk @cloudflare/workers-oauth-provider zod octokit agents@latest # Ensure agents/mcp is available
    ```
*   Install and log in to the Wrangler CLI:
    ```bash
    npm install -g wrangler
    wrangler login
    ```

### 2. GitHub OAuth App Setup

You need to create a GitHub OAuth App to get the necessary credentials.

1.  **Create GitHub OAuth App:**
    *   Go to GitHub Settings → Developer Settings → OAuth Apps → **New OAuth App**.
    *   **Application name:** Choose a name (e.g., "My MCP Server Dev").
    *   **Homepage URL:** For local development, use `http://localhost:8787`. For production, use your deployed worker URL (e.g., `https://your-worker-name.your-account.workers.dev`).
    *   **Authorization callback URL:** This is crucial. Set it to `[Homepage URL]/callback`. For local development, it's `http://localhost:8787/callback`. For production, it's `https://your-worker-name.your-account.workers.dev/callback`.
    *   Click **Register application**.
2.  **Get Credentials:**
    *   On the app's page, note down the **Client ID**.
    *   Generate a **New client secret** and copy it immediately. You won't be able to see it again.
3.  **Required Scopes:** This application requires the following scopes for the tools to function correctly. Ensure your OAuth handler requests them (typically configured in `github-handler.ts`):
    ```typescript
    const GITHUB_SCOPES = [
        'repo',            // Repository access (read/write)
        'user',            // User information (read)
        'gist',            // Gist creation
        'read:org'         // Organization membership (read)
    ].join(' ');
    ```

### 3. Cloudflare KV Namespace Setup

A KV namespace is required to store OAuth session data securely.

*   **Create KV Namespace:**
    ```bash
    # Replace OAUTH_KV with your desired namespace name if different
    npx wrangler kv namespace create OAUTH_KV
    ```
*   **Note the IDs:** Wrangler will output the namespace `id` and `preview_id`. You need these for `wrangler.jsonc`.

**KV Namespace Strategy:**

*   **One Namespace Per Application Type:** Use this `OAUTH_KV` namespace *only* for this GitHub OAuth MCP server application.
*   **Separate Namespaces Per Environment (Recommended):** For `dev`, `staging`, and `production` environments, create *separate physical KV namespaces* (e.g., `oauth-kv-dev`, `oauth-kv-staging`, `oauth-kv-prod`). Use the corresponding `id` and `preview_id` in each environment's `wrangler.jsonc` configuration, but keep the `binding` name (`OAUTH_KV`) consistent in your code.

### 4. Environment Configuration (`wrangler.jsonc`)

Configure your `wrangler.jsonc` file with your Cloudflare account details, GitHub credentials, and KV namespace binding.

```jsonc
// wrangler.jsonc
{
  "name": "remote-mcp-server", // Your worker name
  "main": "src/index.ts",
  "compatibility_date": "2024-03-18", // Or your preferred date
  "vars": {
    // From your GitHub OAuth App settings
    "GITHUB_CLIENT_ID": "YOUR_GITHUB_OAUTH_APP_CLIENT_ID"
    // Note: GITHUB_CLIENT_SECRET should be set as a secret
  },
  "kv_namespaces": [
    {
      "binding": "OAUTH_KV", // The binding name used in your Worker code (Env.OAUTH_KV)
      "id": "YOUR_OAUTH_KV_NAMESPACE_ID", // Paste the 'id' from 'wrangler kv namespace create'
      "preview_id": "YOUR_PREVIEW_ID" // Paste the 'preview_id' for local development
    }
  ]
  // Add build configuration if needed, e.g.:
  // "build": {
  //   "command": "npm run build"
  // }
}
```

**Important:**

*   Replace placeholder values with your actual GitHub Client ID and KV Namespace IDs.
*   **Set the Client Secret securely:** Do **not** put `GITHUB_CLIENT_SECRET` directly in the `vars` section. Use Wrangler secrets:
    ```bash
    # Replace YOUR_GITHUB_OAUTH_APP_CLIENT_SECRET with the actual secret
    npx wrangler secret put GITHUB_CLIENT_SECRET
    # Follow the prompts
    ```

## Local Development & Testing

### Running Locally

1.  Ensure all setup steps (OAuth App, KV, `wrangler.jsonc`, secrets) are complete.
2.  Start the local development server:
    ```bash
    # Use --local for local mode, --persist to keep data between runs,
    # and bind the KV namespace needed for OAuth sessions
    npx wrangler dev --local --persist --kv=OAUTH_KV
    ```
3.  Open your browser to `http://localhost:8787`. This should trigger the GitHub OAuth flow if you haven't authenticated recently.

### Testing with MCP Inspector

The [MCP Inspector](https://modelcontextprotocol.io/docs/tools/inspector) is a dedicated web application designed for developers to interact with and debug MCP servers. It allows you to connect to any MCP server (local or remote), view its available tools, manually call those tools with specific parameters, and inspect the raw request/response communication.

**Installation/Running:**

You can run the MCP Inspector directly using `npx`:

```bash
npx @modelcontextprotocol/inspector
```

This command downloads and runs the latest version of the inspector, typically making it available at `http://localhost:5173` in your browser.

**Connecting to Your Server:**

1.  **Open Inspector:** Navigate to the Inspector UI (e.g., `http://localhost:5173`).
2.  **Configure Transport:**
    *   Select `SSE` (Server-Sent Events) as the **Transport Type**.
    *   Enter the **URL** of your MCP server's SSE endpoint:
        *   **Local:** `http://localhost:8787/sse` (when running with `wrangler dev`)
        *   **Deployed:** `https://your-worker-name.your-account.workers.dev/sse` (replace with your actual worker URL)
3.  **Connect:** Click the **Connect** button.

**Authentication Flow:**

*   Since your server requires authentication, clicking "Connect" will initiate the OAuth flow.
*   The Inspector will likely open a new browser tab or window redirecting you to `http://localhost:8787` (or your deployed URL), which in turn redirects to GitHub for login and authorization.
*   Log in to GitHub (if necessary) and authorize the OAuth App you created.
*   Upon successful authorization, GitHub redirects back to your worker's `/callback` endpoint.
*   Your worker handles the callback, exchanges the code for a token, stores the session in KV, and sets a session cookie.
*   The browser is then redirected back to the MCP Inspector UI.
*   The Inspector, now possessing the session cookie, establishes the persistent SSE connection to your `/sse` endpoint.

**Using Tools:**

1.  **View Tools:** Once connected and authenticated, the Inspector should display a list of available tools fetched from your server (using the `listAvailableTools` meta-tool, if implemented, or by introspection).
2.  **Select Tool:** Choose a tool from the dropdown menu (e.g., `getRepositoryGitHub`).
3.  **Enter Parameters:** Input fields will appear based on the tool's Zod schema. Fill in the required parameters (e.g., `owner`: "cloudflare", `repo`: "workers-sdk").
4.  **Call Tool:** Click the **Call Tool** button.
5.  **View Response:** The Inspector will display the response received from the server, including the result or any errors, often allowing you to view the raw JSON or text content.

**Debugging:**

The Inspector is invaluable for debugging:

*   **Verify Tool Discovery:** Ensure all expected tools are listed.
*   **Test Tool Logic:** Call tools with different parameters to check their behavior and error handling.
*   **Inspect Communication:** Some versions of the inspector might show the raw MCP messages being exchanged over the SSE connection, helping diagnose protocol-level issues.
*   **Isolate Issues:** If a tool works in the Inspector but not in another client (like Claude or Cursor), the issue likely lies in the client's configuration or interaction, not the server itself.

## Deployment

1.  Ensure your `wrangler.jsonc` is configured correctly for your target environment (using environment-specific KV IDs if applicable).
2.  Ensure the `GITHUB_CLIENT_SECRET` secret is set for the production environment.
3.  Deploy the worker:
    ```bash
    npx wrangler deploy
    ```
4.  Update your GitHub OAuth App's **Homepage URL** and **Authorization callback URL** to use your deployed worker's URL (e.g., `https://your-worker-name.your-account.workers.dev`).

## Integration Examples

Connect various clients to your deployed MCP server.

### 1. With MCP Inspector (Remote)

This is covered in the "Testing with MCP Inspector" section above. Simply use your deployed worker's SSE URL when connecting.

### 2. With Cursor Editor

Integrate the tools directly into the Cursor editor:

1.  **Open Cursor Settings:** Navigate to `Settings` > `Extensions` > `Cursor AI`.
2.  **Configure MCP Servers:** Scroll down to the "MCP Servers" section.
3.  **Add Server:** Click "Add MCP Server" and configure:
    *   **Name:** `GitHub OAuth Tools` (or your preferred name).
    *   **URL:** `https://your-worker-name.your-account.workers.dev/sse`.
    *   **Authentication:** Leave blank (handled by the server's OAuth flow).
4.  **Save Settings.**
5.  **Authenticate:** The first time you use a tool (e.g., `@GitHub OAuth Tools list my repos`), Cursor triggers the connection, opening your browser for GitHub login and authorization.

### 3. With Cloudflare AI Playground

The Cloudflare AI Playground also supports connecting to remote MCP servers, providing another way to test your tools directly.

1.  **Navigate to AI Playground:** Go to [playground.ai.cloudflare.com](https://playground.ai.cloudflare.com/).
2.  **Open Settings:** Click the gear icon (⚙️) in the top right corner to open Settings.
3.  **Configure Tool Usage:** Scroll down to the "Tool usage" section.
4.  **Add MCP Server:**
    *   Click "Connect a Tool Provider".
    *   Select "MCP Server" as the type.
    *   **Name:** Enter a name (e.g., "GitHub OAuth MCP").
    *   **URL:** Enter the full SSE URL of your deployed worker (e.g., `https://your-worker-name.your-account.workers.dev/sse`).
    *   Leave authentication fields blank.
    *   Click "Connect".
5.  **Select Tools:** Once connected, you should see your server listed. Ensure it's toggled on for use in the playground.
6.  **Authenticate & Use:** Start a new chat session. When you prompt the AI model to use one of your GitHub tools, the playground will initiate the connection to your `/sse` endpoint. This will trigger the OAuth flow, redirecting you to GitHub for authorization in a new tab or window. After successful authentication, the playground can use the tools via the established session.

**Note:** As with other clients, ensure your worker is deployed and the URL is correct. You might need to refresh the playground page after connecting the server or after successful authentication.

### 4. With Claude Desktop

Configure Claude Desktop to use your MCP server:

1.  Go to Settings > Developer > Edit Config.
2.  Replace the file contents with:
```json
{
  "mcpServers": {
        "github": { // Choose a name for the server in Claude
      "command": "npx",
      "args": [
            "mcp-remote", // The proxy command
            "https://your-worker-name.your-account.workers.dev/sse" // URL to your deployed server
      ]
    }
  }
}
```
3.  Restart Claude. It should open a browser window for GitHub authentication when you first try to use a tool.

## Example Workflows & Time Savings

Leveraging this MCP server through integrated clients like Cursor or the AI Playground can significantly streamline common developer workflows compared to manual methods involving the GitHub UI or CLI switching.

### Workflow 1: Pre-Work Discussion & Tracking

**Goal:** Discuss a new feature or bug, capture the details, and create an issue to track it before starting code changes.

**Using MCP Tools (e.g., in Cursor):**

1.  Discuss the feature/bug requirements and potential approaches with the AI assistant.
2.  Ask the assistant: `"@GitHub Can you create an issue in the your-org/your-repo repository titled 'Feature: New Cool Thing'? The body should summarize our discussion about [mention key points]."`
3.  *(Optional)* Ask: `"@GitHub Show me the details for issue number [issue number from previous step] in your-org/your-repo."` to confirm creation.

**Manual Method:**

1.  Discuss the feature/bug.
2.  Identify key details from the discussion.
3.  Copy relevant points or summaries.
4.  Open browser, navigate to `github.com/your-org/your-repo`.
5.  Click the "Issues" tab.
6.  Click "New Issue".
7.  Paste/type the title ("Feature: New Cool Thing").
8.  Paste/type the body, formatting as needed.
9.  Click "Submit new issue".
10. *(Optional)* Refresh page or navigate to the issue to confirm.

**Time Savings:** Reduces context switching and manual copy-pasting. Allows for seamless transition from discussion to action item creation directly within the development environment. **Estimated savings: 2-3 minutes per issue.**

### Workflow 2: Quick Repository Status Check

**Goal:** Quickly see the latest commits and open PRs for a repository to understand recent activity.

**Using MCP Tools:**

1.  Ask: `"@GitHub Show me the latest 5 commits for the some-org/some-repo repository."`
2.  Ask: `"@GitHub List the open pull requests for some-org/some-repo."`

**Manual Method:**

1.  Open browser, navigate to `github.com/some-org/some-repo`.
2.  Click on the "Commits" link or tab. Wait for load. Scan commits.
3.  Navigate back or click the "Pull requests" tab. Wait for load.
4.  Ensure the filter is set to "Open". Scan PRs.

**Time Savings:** Avoids multiple page loads and UI navigation clicks. Provides a quick summary directly in your chat or editor context without leaving your current task. **Estimated savings: 30 seconds - 1 minute per check.**

### Workflow 3: Adding Context to an Existing Issue

**Goal:** Find relevant code snippets related to an issue and add them as a comment.

**Using MCP Tools:**

1.  Identify the issue number (e.g., #123).
2.  Ask the assistant to find relevant code: `"@GitHub Search for code mentioning 'specificFunction' within the src/utils path of the your-org/your-repo repository."`
3.  Review the code results provided by the assistant.
4.  Ask the assistant: `"@GitHub Add a comment to issue #123 in your-org/your-repo saying 'Found these relevant snippets related to the problem:' and include the code snippets you just found."`

**Manual Method:**

1.  Remember or look up the issue number (#123).
2.  Manually search the codebase (using editor search or GitHub search) for `specificFunction` in `src/utils`.
3.  Copy the relevant code snippets.
4.  Open browser, navigate to `github.com/your-org/your-repo/issues/123`.
5.  Scroll to the comment box.
6.  Paste the snippets, adding code formatting (backticks).
7.  Add explanatory text.
8.  Click "Comment".

**Time Savings:** Significantly speeds up finding relevant code and adding it to the issue context, avoiding manual search, copy-pasting between windows, and UI navigation. **Estimated savings: 2-5 minutes per comment.**

---

*This section aims to illustrate potential efficiency gains using the currently implemented tools. Actual time saved will vary. The primary benefit often lies in reduced cognitive load from staying within a single development environment.*

## Testing Tool Functionality

This section provides example prompts and expected outcomes for testing each available tool using an integrated client like Cursor or the AI Playground. Replace bracketed placeholders like `[owner]`, `[repo-name]`, `[issue-number]`, etc., with actual values during testing.

### 1. GitHub Repository Tools

#### Tool: `getRepositoryGitHub`
-   **Prompt:** `"@GitHub Show me the details for the cloudflare/workers-sdk repository."`
-   **Expected Outcome:** Returns a JSON object containing detailed metadata about the specified repository (e.g., description, star count, URLs, language).
-   **Potential Errors:** Fails if the repository doesn't exist or the authenticated user lacks permission to view it (for private repos).

#### Tool: `listMyReposGitHub`
-   **Prompt:** `"@GitHub List my repositories."`
-   **Expected Outcome:** Returns a list of repositories accessible to the authenticated user.
-   **Potential Errors:** Might fail if the token lacks the necessary 'repo' scope.

#### Tool: `getRepoContentsGitHub`
-   **Prompt:** `"@GitHub List the contents of the src directory for cloudflare/workers-sdk."`
-   **Expected Outcome:** Returns a list of files and directories within the specified path of the repository.
-   **Potential Errors:** Fails if the path or repository doesn't exist, or for permission issues on private repos.

#### Tool: `getRepoReadmeGitHub`
-   **Prompt:** `"@GitHub Get the README content for cloudflare/workers-sdk."`
-   **Expected Outcome:** Returns the plain text content of the repository's README file.
-   **Potential Errors:** Fails if the repository has no README or cannot be accessed.

#### Tool: `getRepoFileContentGitHub`
-   **Prompt:** `"@GitHub Show me the content of the package.json file in cloudflare/workers-sdk."`
-   **Expected Outcome:** Returns the plain text content of the specified file.
-   **Potential Errors:** Fails if the file path or repository is invalid, or for permission issues.

### 2. Issue & PR Management

#### Tool: `listIssuesGitHub`
-   **Prompt:** `"@GitHub List the open issues for cloudflare/workers-sdk."`
-   **Expected Outcome:** Returns a list of open issues for the specified repository.
-   **Potential Errors:** Fails if the repository doesn't exist or issues are disabled/inaccessible.

#### Tool: `createIssueGitHub`
-   **Prompt:** `"@GitHub Create an issue in [your-test-repo-owner]/[your-test-repo-name] titled 'Test Issue via MCP' with the body 'This is a test issue created through the MCP server.'"`
-   **Expected Outcome:** Successfully creates the issue and returns a confirmation message, usually including the new issue's URL.
-   **Potential Errors:** Fails if the repository doesn't exist, the user lacks write permissions, or the token lacks the 'repo' scope.

#### Tool: `getIssueGitHub`
-   **Prompt:** `"@GitHub Get the details for issue number 1 in cloudflare/workers-sdk."`
-   **Expected Outcome:** Returns a JSON object with detailed information about the specified issue.
-   **Potential Errors:** Fails if the issue number or repository is invalid.

#### Tool: `createCommentGitHub`
-   **Prompt:** `"@GitHub Add a comment to issue #1 in [your-test-repo-owner]/[your-test-repo-name] saying 'Testing comment creation via MCP.'"`
-   **Expected Outcome:** Successfully adds the comment to the specified issue and returns a confirmation.
-   **Potential Errors:** Fails if the issue/repo doesn't exist, the user lacks permission to comment, or the token lacks the 'repo' scope.

#### Tool: `updateIssueStateGitHub`
-   **Prompt:** `"@GitHub Close issue #1 in [your-test-repo-owner]/[your-test-repo-name]."` (Use an *open* issue you can modify)
-   **Expected Outcome:** Successfully updates the issue state (to closed or open) and returns confirmation.
-   **Potential Errors:** Fails if the issue/repo doesn't exist, the user lacks permission, or the token lacks the 'repo' scope.

#### Tool: `listPullRequestsGitHub`
-   **Prompt:** `"@GitHub List the open pull requests for cloudflare/workers-sdk."`
-   **Expected Outcome:** Returns a list of open pull requests for the repository.
-   **Potential Errors:** Fails if the repository doesn't exist or PRs are inaccessible.

#### Tool: `getPullRequestGitHub`
-   **Prompt:** `"@GitHub Show me the details for pull request #1000 in cloudflare/workers-sdk."`
-   **Expected Outcome:** Returns a JSON object with detailed information about the specified pull request.
-   **Potential Errors:** Fails if the PR number or repository is invalid.

### 3. Search Functionality

#### Tool: `searchGitHubCode`
-   **Prompt:** `"@GitHub Search code in cloudflare/workers-sdk for 'fetch'."`
-   **Expected Outcome:** Returns a list of code search results matching the query within the specified scope.
-   **Potential Errors:** Can return many results; might fail on complex queries or for inaccessible code.

#### Tool: `searchIssuesAndPRsGitHub`
-   **Prompt:** `"@GitHub Search for open issues mentioning 'types' in cloudflare/workers-sdk."`
-   **Expected Outcome:** Returns a list of issues and PRs matching the search query.
-   **Potential Errors:** Depends on GitHub search indexing and query complexity.

#### Tool: `searchRepositoriesGitHub`
-   **Prompt:** `"@GitHub Search for repositories named 'mcp'."`
-   **Expected Outcome:** Returns a list of repositories matching the search query.
-   **Potential Errors:** Standard search limitations apply.

#### Tool: `searchCommitsGitHub`
-   **Prompt:** `"@GitHub Search commits in cloudflare/workers-sdk with the message 'fix'."`
-   **Expected Outcome:** Returns a list of commits matching the search query.
-   **Potential Errors:** Search is often limited to the default branch unless a specific repo is included in the query.

#### Tool: `searchUsersGitHub`
-   **Prompt:** `"@GitHub Search for users named 'kulavic'."`
-   **Expected Outcome:** Returns a list of users matching the search query.
-   **Potential Errors:** Standard search limitations.

#### Tool: `searchGitHub`
-   **Prompt:** `"@GitHub Search all of GitHub for 'Model Context Protocol'."`
-   **Expected Outcome:** Returns combined search results across multiple types (code, issues, repos, etc.) based on the query.
-   **Potential Errors:** Can be broad; results depend heavily on query and GitHub search capabilities.

### 4. Version Control Tools

#### Tool: `listBranchesGitHub`
-   **Prompt:** `"@GitHub List the branches for cloudflare/workers-sdk."`
-   **Expected Outcome:** Returns a list of branch names for the specified repository.
-   **Potential Errors:** Fails if the repository doesn't exist or is inaccessible.

#### Tool: `getBranchGitHub`
-   **Prompt:** `"@GitHub Get details about the 'main' branch in cloudflare/workers-sdk."`
-   **Expected Outcome:** Returns detailed information about the specified branch.
-   **Potential Errors:** Fails if the branch or repository doesn't exist.

#### Tool: `listTagsGitHub`
-   **Prompt:** `"@GitHub List the tags for cloudflare/workers-sdk."`
-   **Expected Outcome:** Returns a list of tags for the specified repository.
-   **Potential Errors:** Fails if the repository doesn't exist or has no tags.

#### Tool: `listCommitsGitHub`
-   **Prompt:** `"@GitHub Show the 5 most recent commits for cloudflare/workers-sdk on the 'main' branch."`
-   **Expected Outcome:** Returns a list of commit objects for the specified branch.
-   **Potential Errors:** Fails if the branch or repository doesn't exist.

#### Tool: `getCommitGitHub`
-   **Prompt:** `"@GitHub Get the details for commit [paste-a-valid-commit-sha-from-workers-sdk] in cloudflare/workers-sdk."`
-   **Expected Outcome:** Returns detailed information about the specified commit.
-   **Potential Errors:** Fails if the commit SHA or repository is invalid.

### 5. User Operations

#### Tool: `userInfoOctokit`
-   **Prompt:** `"@GitHub Show me my user information."`
-   **Expected Outcome:** Returns a JSON object containing the authenticated user's GitHub profile information.
-   **Potential Errors:** Should generally work if authentication was successful.

#### Tool: `createGistGitHub`
-   **Prompt:** `"@GitHub Create a private Gist named 'test-mcp.txt' with the content 'Hello from MCP!' and description 'Test Gist creation.'"`
-   **Expected Outcome:** Successfully creates the Gist and returns a confirmation, usually including the Gist's URL.
-   **Potential Errors:** Fails if the token lacks the 'gist' scope.

### 6. Basic/Meta Tools

#### Tool: `add`
-   **Prompt:** `"@GitHub Add the numbers 123 and 456."`
-   **Expected Outcome:** Returns the sum of the two numbers (e.g., "The sum is 579").
-   **Potential Errors:** Should work reliably if the server is running.

#### Tool: `listAvailableTools`
-   **Prompt:** `"@GitHub What tools do you have?"`
-   **Expected Outcome:** Returns a formatted list of all available tools and their descriptions (as manually defined in the code).
-   **Potential Errors:** Should work reliably if the server is running.

---

## Core Architecture Explained

Understanding the internal components.

### 1. MCP Agent Implementation (`MyMCP`)

The heart of the server is the `MyMCP` class, which extends `McpAgent`. It manages the MCP server lifecycle, tool registration, and integrates with the authentication context (`Props`) and environment bindings (`Env`).

```typescript
// src/index.ts
import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Octokit } from "octokit"; // For GitHub API calls

// Import tool registration functions
import { registerAddTool } from "./tools/add";
import { registerUserInfoOctokitTool } from "./tools/userInfoOctokit";
import { registerGitHubTools } from "./tools/github";

// Defines the authenticated user context passed by the OAuth flow
type Props = {
    login: string;      // GitHub username
    name: string;       // User's full name
    email: string;      // User's email
    accessToken: string; // GitHub OAuth access token (CRITICAL)
};

// Defines environment bindings required by the Worker
type Env = {
    AI: Ai; // Example: Cloudflare AI binding
    OAUTH_KV: KVNamespace; // KV for storing OAuth sessions
    GITHUB_CLIENT_ID: string; // OAuth App Client ID
    GITHUB_CLIENT_SECRET: string; // OAuth App Client Secret
    // Add other necessary bindings like secrets or other services
};

export class MyMCP extends McpAgent<Props, Env> {
    // Initialize the MCP server instance
    server = new McpServer({
        name: "Github OAuth Proxy Demo",
        version: "1.0.0",
    });

    // Asynchronous initialization runs when the agent starts
    async init() {
        console.log(">>> MyMCP init started. Props:", this.props);

        // --- Tool Registration ---
        // Register a simple, non-authenticated tool
        registerAddTool(this.server);

        // Register tools requiring authentication (pass Props)
        registerUserInfoOctokitTool(this.server, this.props);
        registerGitHubTools(this.server, this.env, this.props); // Pass Env and Props

        // Register the meta-tool for discovering other tools
        this.registerToolDiscovery();

        console.log(">>> MyMCP init finished.");
    }

    // Helper method for tool discovery (manual list)
    private registerToolDiscovery() {
        // Implementation detailed further below
  }
}
```

### 2. OAuth Provider Setup (`@cloudflare/workers-oauth-provider`)

The `OAuthProvider` handles the complexities of the OAuth 2.0 flow, directing users to GitHub for login and managing the callback to exchange the authorization code for an access token.

```typescript
// src/index.ts
import OAuthProvider from "@cloudflare/workers-oauth-provider";
import { GitHubHandler } from "./github-handler"; // Your custom OAuth handler logic

// Export the configured OAuth provider as the default Worker export
export default new OAuthProvider({
    apiRoute: "/sse",                   // Endpoint where the MCP agent listens (Server-Sent Events)
    apiHandler: MyMCP.mount('/sse'),    // Mounts the McpAgent to handle requests on /sse
    defaultHandler: GitHubHandler,       // Custom handler to initiate the OAuth flow (e.g., redirect to /authorize)
    authorizeEndpoint: "/authorize",     // Path that triggers the redirect to GitHub's authorization page
    tokenEndpoint: "/token",            // Internal endpoint used by the provider (not directly called)
    clientRegistrationEndpoint: "/register", // Required by type, potentially unused in this flow
});
```

### 3. Tool Implementation Example (`createIssue`)

This example shows how to implement a tool that requires authentication (`accessToken` from `Props`) and interacts with the GitHub API using `octokit`.

```typescript
// tools/github/index.ts
import { McpServer, McpToolResult } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Octokit } from "octokit";
// Import Props and Env types if needed from their definition file
// import type { Props, Env } from "../../src/index";

// Ensure Props and Env match the types defined in src/index.ts
type Props = { login: string; name: string; email: string; accessToken: string; };
type Env = { AI: Ai; OAUTH_KV: KVNamespace; GITHUB_CLIENT_ID: string; GITHUB_CLIENT_SECRET: string; };

export function registerGitHubTools(
    server: McpServer,
    env: Env, // Pass Env if tools need access to bindings like secrets or KV
    props: Props | null // Pass Props containing the accessToken
): void {
    // --- Authentication Check ---
    // Tools requiring auth should not be registered if no token is available
    if (!props?.accessToken) {
        console.warn("Skipping GitHub tool registration: No access token found in Props.");
        return; // Exit registration if not authenticated
    }

    // --- Initialize Octokit ---
    // Create an authenticated Octokit instance
    const octokit = new Octokit({
        auth: props.accessToken,
        userAgent: 'remote-mcp-server-v1', // Identify your application
    });

    // --- Tool: createIssue ---
    server.tool(
        "createIssueGitHub", // Use consistent naming (e.g., suffix with GitHub)
        "Create a new issue in a specific repository",
        // Zod schema defines required parameters and their types
        z.object({
            owner: z.string().describe("The owner of the repository (user or organization)"),
            repo: z.string().describe("The name of the repository"),
            title: z.string().describe("The title of the new issue"),
            body: z.string().optional().describe("The content body of the new issue (optional)"),
            // Add labels, assignees etc. as needed
        }),
        // Async function executes the tool logic
        async (params): Promise<McpToolResult> => {
            console.log(`>>> createIssueGitHub tool called with params:`, params);
            try {
                // Call the GitHub API using the authenticated Octokit client
                const response = await octokit.rest.issues.create({
                    owner: params.owner,
                    repo: params.repo,
                    title: params.title,
                    body: params.body, // Pass optional body
                });

                // --- Successful Result Formatting ---
                // Return the created issue's URL or relevant data in MCP format
                console.log(`<<< createIssueGitHub successful: ${response.data.html_url}`);
                return {
                    result: `Successfully created issue: ${response.data.html_url}`,
                    // Optionally return structured data:
                    // content: [{ type: "json", json: response.data }]
                };

            } catch (error: any) {
                // --- Error Handling ---
                console.error(`Error in createIssueGitHub tool:`, error);

                // Provide specific error feedback to the agent
                let errorMessage = `Failed to create issue: ${error.message || 'Unknown error'}`;
                if (error.status === 404) {
                    errorMessage = `Repository not found or insufficient permissions for ${params.owner}/${params.repo}.`;
                } else if (error.status === 401 || error.status === 403) {
                    errorMessage = "Authentication error. Token might be invalid, expired, or lack necessary scopes ('repo' scope required for creating issues).";
                } else if (error.status === 422) {
                    errorMessage = `Validation failed. Check issue parameters. Details: ${error.message}`;
                }

                return { error: errorMessage };
            }
        }
    );

    // --- Register other GitHub tools similarly ---
    // Example: getRepository registration (condensed)
    server.tool(
        "getRepositoryGitHub",
        "Get details for a specific repository",
        z.object({ owner: z.string(), repo: z.string() }),
        async ({ owner, repo }) => {
            // (Implementation with try/catch as above)
        }
    );

    // ... registration for listIssuesGitHub, createCommentGitHub, searchGitHub, etc. ...
    // Use consistent naming (e.g., listIssuesGitHub) for clarity
}
```

### 4. Tool Discovery Implementation (Manual Synchronization Required)

This tool allows agents to ask what functionalities are available. **Crucially, this list must be manually updated whenever you add, remove, or rename tools.**

```typescript
// src/index.ts (within MyMCP class)
private registerToolDiscovery() {
    this.server.tool(
        "listAvailableTools", // Standard name for discovery
        "Lists all available tools and their descriptions (manual list).",
        z.object({ // No input parameters needed
            random_string: z.string().optional().describe("Dummy parameter for no-parameter tools")
        }),
        async (): Promise<McpToolResult> => {
            console.log(">>> listAvailableTools tool: Generating manual tool list...");
            try {
                // --- Manually maintain this list! ---
                // Reflect ALL tools registered in init()
                const toolInfo = [
                    // Basic Tools
                    { name: "add", description: "Add two numbers the way only MCP can" },

                    // User Info
                    { name: "userInfoOctokit", description: "Get user info from GitHub, via Octokit" },

                    // Repository Tools
                    { name: "getRepositoryGitHub", description: "Get details for a specific repository" },
                    { name: "listMyReposGitHub", description: "List repositories for the authenticated user" },
                    { name: "getRepoContentsGitHub", description: "List files and directories at a specific path within a repository" },
                    { name: "getRepoReadmeGitHub", description: "Get the content of the README file for a repository" },
                    { name: "getRepoFileContentGitHub", description: "Get the content of a specific file within a repository" },

                    // Issue & PR Tools
                    { name: "listIssuesGitHub", description: "List issues for a specific repository" },
                    { name: "createIssueGitHub", description: "Create a new issue in a specific repository" },
                    { name: "getIssueGitHub", description: "Get detailed information for a specific issue by number" },
                    { name: "createCommentGitHub", description: "Add a comment to a specific issue or pull request" },
                    { name: "updateIssueStateGitHub", description: "Update the state of an issue (open or closed)" },
                    { name: "listPullRequestsGitHub", description: "List pull requests for a specific repository" },
                    { name: "getPullRequestGitHub", description: "Get detailed information for a specific pull request by number" },

                    // Version Control Tools
                    { name: "listCommitsGitHub", description: "Get recent commit history for a branch" },
                    { name: "getCommitGitHub", description: "Get details for a specific commit SHA" },
                    { name: "listBranchesGitHub", description: "List branches in a repository" },
                    { name: "getBranchGitHub", description: "Get details for a specific branch" },
                    { name: "listTagsGitHub", description: "List tags in a repository" },

                    // Content Creation
                    { name: "createGistGitHub", description: "Create a new public or private Gist" },

                    // Search Tools
                    { name: "searchGitHubCode", description: "Search for code within GitHub repositories" },
                    { name: "searchIssuesAndPRsGitHub", description: "Search for Issues and Pull Requests" },
                    { name: "searchRepositoriesGitHub", description: "Search for repositories" },
                    { name: "searchCommitsGitHub", description: "Search for commits" },
                    { name: "searchUsersGitHub", description: "Search for users and organizations" },
                    { name: "searchGitHub", description: "Search GitHub across multiple types (code, issues, repos, etc.)" },

                    // Meta Tool (Self-listing)
                    { name: "listAvailableTools", description: "Lists all available tools and their descriptions (manual list)." },
                ];
                // --- End of manual list ---

                let toolListText = "Available Tools (Manually Listed):\n";
                toolInfo.forEach(tool => {
                    toolListText += ` - ${tool.name}: ${tool.description}\n`;
                });

                console.log("<<< listAvailableTools tool: Successfully generated manual tool list.");
                // Return the list as text content
                return { content: [{ type: "text", text: toolListText.trim() }] };

            } catch (error: any) {
                console.error(`>>> listAvailableTools tool: Error generating tool list:`, error);
                return { error: `Error listing tools: ${error.message || String(error)}` };
            }
        }
    );
}
```

## OAuth Authentication Flow Explained

*(This entire detailed section remains largely the same as before)*

## Security Considerations

*(This entire section remains largely the same as before)*

## Debugging

Tips for troubleshooting issues.

### 1. Local Development Debugging

*   **Check `wrangler dev` output:** Look for errors during startup or request handling.
*   **Use `console.log`:** Add logging within your `MyMCP` class, tool implementations, and `GitHubHandler`.
*   **Test MCP Connection:** Use `npx mcp-remote http://localhost:8787/sse` to connect directly and see raw communication.
*   **Inspect KV:** Use `npx wrangler kv key list --binding=OAUTH_KV --preview` to see session keys (requires `preview_id` in `wrangler.jsonc`). Use `npx wrangler kv key get "session:SESSION_ID" --binding=OAUTH_KV --preview` to view session data.
*   **Clear Auth Cache:** If authentication seems stuck, try removing the local cache: `rm -rf ~/.mcp-auth`.
*   **Browser Developer Tools:** Check the network tab during the OAuth redirect flow for errors.

### 2. Production Monitoring

*   **Worker Logs:** Use `npx wrangler tail` to view live logs from your deployed worker.
*   **Cloudflare Dashboard:** Check Worker analytics for invocation counts, CPU time, and errors.
*   **KV Metrics:** Monitor KV read/write operations and storage usage.
*   **Inspect KV (Production):** Use `npx wrangler kv key list --binding=OAUTH_KV` (no `--preview`) to see production keys. Use `npx wrangler kv key get "session:SESSION_ID" --binding=OAUTH_KV` (no `--preview`) to view production session data.

## Contributing

1.  Fork the repository.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

## Resources

*   [Model Context Protocol Documentation](https://modelcontextprotocol.io/docs)
*   [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
*   [`@cloudflare/workers-oauth-provider`](https://github.com/cloudflare/workers-oauth-provider) (Check for package details)
*   [Octokit Documentation](https://octokit.github.io/rest.js/v20)
*   [GitHub REST API Documentation](https://docs.github.com/en/rest)
*   [Zod Documentation](https://zod.dev/)

## License

Distributed under the MIT License. See `LICENSE` file for more information.