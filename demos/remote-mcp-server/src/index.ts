import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
// Keep Octokit and Buffer if needed elsewhere, remove if only used in moved tools
// import { Octokit } from "octokit";
// import { Buffer } from 'node:buffer';

import OAuthProvider from "@cloudflare/workers-oauth-provider";
import { GitHubHandler } from "./github-handler";

// Import tool registration functions
import { registerAddTool } from "./tools/add";
import { registerUserInfoOctokitTool } from "./tools/userInfoOctokit";
import { registerGitHubTools } from "./tools/github"; // Placeholder for future tools

// --- Define Types --- //
// Context from the auth process, encrypted & stored in the auth token
// and provided to the DurableMCP as this.props
// Ensure this Props type includes fields needed by ALL tools (e.g., accessToken, login)
type Props = {
	login: string;
	name: string;
	email: string;
	accessToken: string;
};

// Define Env bindings needed by MyMCP and its tools
// Ensure this Env type includes bindings needed by ALL tools (e.g., AI)
type Env = {
	AI: Ai;
	// Add other bindings if needed, e.g., OAUTH_KV, GITHUB_CLIENT_ID etc. if accessed directly in MyMCP
};
// --- End Define Types --- //

// --- Define Constants --- //
// Removed ALLOWED_USERNAMES constant
// const ALLOWED_USERNAMES = new Set<string>([
// 	// Add GitHub usernames of users who should have access to the image generation tool
// 	// For example: 'yourusername', 'coworkerusername'
// ]);
// --- End Define Constants --- //

export class MyMCP extends McpAgent<Props, Env> {
	server = new McpServer({
		name: "Github OAuth Proxy Demo",
		version: "1.0.0",
	});

	async init() {
		console.log(">>> MyMCP init started. Props:", this.props);

		// Register basic tools
		registerAddTool(this.server);

		// Register GitHub User Info tool (depends on props)
		registerUserInfoOctokitTool(this.server, this.props as Props | null);

		// Register other GitHub tools (depends on props and env)
		registerGitHubTools(this.server, this.env, this.props as Props | null);

		// --- Register Meta Tool: List Available Tools (Register Last!) ---
		this.server.tool(
			"listAvailableTools",
			"Lists all available tools and their descriptions (manual list).",
			{},
			async () => {
				console.log(">>> listAvailableTools tool: Generating manual tool list...");
				try {
					// --- Manually maintain this list! ---
					const toolInfo = [
						{ name: "add", description: "Add two numbers the way only MCP can" },
						{ name: "userInfoOctokit", description: "Get user info from GitHub, via Octokit" },
						{ name: "getRepository", description: "Get details for a specific repository" },
						{ name: "listMyRepos", description: "List repositories for the authenticated user" },
						{ name: "listIssues", description: "List issues for a specific repository" },
						{ name: "createIssue", description: "Create a new issue in a specific repository" },
						{ name: "getRepoContents", description: "List files and directories at a specific path within a repository" },
						{ name: "getRepoReadme", description: "Get the content of the README file for a repository" },
						{ name: "getIssue", description: "Get detailed information for a specific issue by number" },
						{ name: "createComment", description: "Add a comment to a specific issue or pull request" },
						{ name: "updateIssueState", description: "Update the state of an issue (open or closed)" },
						{ name: "listPullRequests", description: "List pull requests for a specific repository" },
						{ name: "getPullRequest", description: "Get detailed information for a specific pull request by number" },
						{ name: "getRepoFileContent", description: "Get the content of a specific file within a repository" },
						{ name: "searchGitHubCode", description: "Search for code within GitHub repositories" },
						// Add this tool itself to the list
						{ name: "listAvailableTools", description: "Lists all available tools and their descriptions (manual list)." },
					];
					// --- End of manual list ---

					let toolListText = "Available Tools (Manually Listed):\n";
					toolInfo.forEach(tool => {
						toolListText += ` - ${tool.name}: ${tool.description}\n`;
					});

					console.log(">>> listAvailableTools tool: Successfully generated manual tool list.");
					return {
						content: [{ type: "text", text: toolListText.trim() }]
					};
				} catch (error) {
					console.error(`>>> listAvailableTools tool: Error generating tool list:`, error);
					return {
						content: [{ type: "text", text: `Error listing tools: ${error instanceof Error ? error.message : String(error)}`}]
					}
				}
			}
		);

		console.log(">>> MyMCP init finished.");
	}
}

// Remove the incorrect app.route call:
// app.route('/sse', MyMCP.mount('/sse'));

// Export the correctly configured OAuthProvider
export default new OAuthProvider({
	apiRoute: "/sse",
	// Use 'as any' for type compatibility workaround
	apiHandler: MyMCP.mount('/sse') as any,
	defaultHandler: GitHubHandler as any,
	authorizeEndpoint: "/authorize",
	// Add required endpoints, even if unused by our GitHub flow
	tokenEndpoint: "/token", // Handled internally by provider
	clientRegistrationEndpoint: "/register", // Required by type
});