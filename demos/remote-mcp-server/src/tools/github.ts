// Placeholder for GitHub-specific tools

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Octokit } from "octokit";
import { Buffer } from 'node:buffer'; // Needed for base64 decoding

// Import individual tool registration functions
import { registerGetRepositoryTool } from "./github/getRepository";
import { registerListMyReposTool } from "./github/listMyRepos";
import { registerListIssuesTool } from "./github/listIssues";
import { registerCreateIssueTool } from "./github/createIssue";
import { registerGetRepoContentsTool } from "./github/getRepoContents";
import { registerGetRepoReadmeTool } from "./github/getRepoReadme";
import { registerGetIssueTool } from "./github/getIssue";
import { registerCreateCommentTool } from "./github/createComment";
import { registerUpdateIssueStateTool } from "./github/updateIssueState";
import { registerListPullRequestsTool } from "./github/listPullRequests";
import { registerGetPullRequestTool } from "./github/getPullRequest";
import { registerGetRepoFileContentTool } from "./github/getRepoFileContent";
import { registerSearchGitHubCodeTool } from "./github/searchGitHubCode";
import { registerListCommitsTool } from "./github/listCommits";
import { registerGetCommitTool } from "./github/getCommit";
import { registerListBranchesTool } from "./github/listBranches";
import { registerGetBranchTool } from "./github/getBranch";
import { registerListTagsTool } from "./github/listTags";
import { registerCreateGistTool } from "./github/createGist";
import { registerSearchIssuesAndPRsTool } from "./github/searchIssuesAndPRs";
import { registerSearchRepositoriesTool } from "./github/searchRepositories";
import { registerSearchCommitsTool } from "./github/searchCommits";
import { registerSearchUsersTool } from "./github/searchUsers";
import { registerSearchGitHubTool } from "./github/searchGitHub";

// Define common types if needed, or import from a central types file
type Props = { accessToken?: string; /* other props */ };
type Env = { /* env bindings */ };

// Main function to register all GitHub tools
export function registerGitHubTools(server: McpServer, env: Env | unknown, props: Props | null) {
	// Initialize Octokit only once
	const octokit = props?.accessToken ? new Octokit({ auth: props.accessToken }) : null;

	// Guard clause: If no access token, don't register any GitHub tools
	if (!octokit) {
		console.warn(">>> Skipping GitHub tools registration: Missing access token.");
		return; 
	}

	console.log(">>> Registering GitHub tools...");

	// Call registration functions for each tool, passing the server and octokit instance
	registerGetRepositoryTool(server, octokit);
	registerListMyReposTool(server, octokit);
	registerListIssuesTool(server, octokit);
	registerCreateIssueTool(server, octokit);
	registerGetRepoContentsTool(server, octokit);
	registerGetRepoReadmeTool(server, octokit);
	registerGetIssueTool(server, octokit);
	registerCreateCommentTool(server, octokit);
	registerUpdateIssueStateTool(server, octokit);
	registerListPullRequestsTool(server, octokit);
	registerGetPullRequestTool(server, octokit);
	registerGetRepoFileContentTool(server, octokit);
	registerSearchGitHubCodeTool(server, octokit);
	registerListCommitsTool(server, octokit);
	registerGetCommitTool(server, octokit);
	registerListBranchesTool(server, octokit);
	registerGetBranchTool(server, octokit);
	registerListTagsTool(server, octokit);
	registerCreateGistTool(server, octokit);
	registerSearchIssuesAndPRsTool(server, octokit);
	registerSearchRepositoriesTool(server, octokit);
	registerSearchCommitsTool(server, octokit);
	registerSearchUsersTool(server, octokit);
	registerSearchGitHubTool(server, octokit);

	console.log(">>> Finished registering GitHub tools.");
} 