// Placeholder for GitHub-specific tools

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Octokit } from "octokit";
import { Buffer } from 'node:buffer'; // Needed for base64 decoding

// Define common types if needed, or import from a central types file
type Props = { accessToken?: string; /* other props */ };
type Env = { /* env bindings */ };

// Function structure for registering GitHub tools
export function registerGitHubTools(server: McpServer, env: Env | unknown, props: Props | null) {
	const octokit = props?.accessToken ? new Octokit({ auth: props.accessToken }) : null;

	if (!octokit) {
		console.warn(">>> Skipping GitHub tools registration: Missing access token.");
		return; // Can't register GitHub tools without auth
	}

	console.log(">>> Registering GitHub tools...");

	// --- Tool: Get Repository Details ---
	server.tool(
		"getRepository",
		"Get details for a specific repository",
		{
			owner: z.string().describe("The owner of the repository (user or organization)"),
			repo: z.string().describe("The name of the repository"),
		},
		async ({ owner, repo }) => {
			try {
				console.log(`>>> getRepository tool: Fetching details for ${owner}/${repo}`);
				const { data: repository } = await octokit.rest.repos.get({
					owner,
					repo,
				});
				console.log(`>>> getRepository tool: Successfully fetched details for ${owner}/${repo}`);
				return {
					content: [{ type: "text", text: JSON.stringify(repository, null, 2) }]
				};
			} catch (error) {
				console.error(`>>> getRepository tool: Error fetching repository ${owner}/${repo}:`, error);
				return {
					content: [{ type: "text", text: `Error fetching repository ${owner}/${repo}: ${error instanceof Error ? error.message : String(error)}`}]
				}
			}
		}
	);

	// --- Tool: List My Repositories ---
	server.tool(
		"listMyRepos",
		"List repositories for the authenticated user",
		{},
		async () => {
			try {
				console.log(`>>> listMyRepos tool: Fetching repositories for authenticated user`);
				const repos = await octokit.paginate(octokit.rest.repos.listForAuthenticatedUser, {
					type: 'owner', // List repos owned by the authenticated user
					per_page: 100 // Fetch up to 100 per page (adjust as needed)
				});
				
				const repoNames = repos.map(repo => repo.full_name);
				console.log(`>>> listMyRepos tool: Found ${repoNames.length} repositories.`);
				
				return {
					content: [{ type: "text", text: `Repositories owned by you:\n - ${repoNames.join('\n - ')}` }]
				};
			} catch (error) {
				console.error(`>>> listMyRepos tool: Error fetching repositories:`, error);
				return {
					content: [{ type: "text", text: `Error fetching repositories: ${error instanceof Error ? error.message : String(error)}`}]
				}
			}
		}
	);

	// --- Tool: List Issues --- 
	server.tool(
		"listIssues",
		"List issues for a specific repository",
		{
			owner: z.string().describe("The owner of the repository (user or organization)"),
			repo: z.string().describe("The name of the repository"),
			state: z.enum(["open", "closed", "all"]).optional().default("open").describe("Filter by issue state (open, closed, all)"),
		},
		async ({ owner, repo, state }) => {
			try {
				console.log(`>>> listIssues tool: Fetching ${state} issues for ${owner}/${repo}`);
				const issues = await octokit.paginate(octokit.rest.issues.listForRepo, {
					owner,
					repo,
					state,
					per_page: 50, // Limit pagination results slightly
				});
				
				const issueList = issues.map(issue => `#${issue.number}: ${issue.title} (${issue.state})`);
				const responseText = issueList.length > 0 
					? `${state.toUpperCase()} issues for ${owner}/${repo}:\n - ${issueList.join('\n - ')}` 
					: `No ${state} issues found for ${owner}/${repo}.`;

				console.log(`>>> listIssues tool: Found ${issueList.length} ${state} issues for ${owner}/${repo}.`);
				return {
					content: [{ type: "text", text: responseText }]
				};
			} catch (error) {
				console.error(`>>> listIssues tool: Error fetching issues for ${owner}/${repo}:`, error);
				return {
					content: [{ type: "text", text: `Error fetching issues for ${owner}/${repo}: ${error instanceof Error ? error.message : String(error)}`}]
				}
			}
		}
	);

	// --- Tool: Create Issue ---
	server.tool(
		"createIssue",
		"Create a new issue in a specific repository",
		{
			owner: z.string().describe("The owner of the repository (user or organization)"),
			repo: z.string().describe("The name of the repository"),
			title: z.string().describe("The title of the new issue"),
			body: z.string().optional().describe("The content body of the new issue"),
			// Future enhancements: labels: z.array(z.string()).optional(), assignees: z.array(z.string()).optional()
		},
		async ({ owner, repo, title, body }) => {
			try {
				console.log(`>>> createIssue tool: Creating issue '${title}' in ${owner}/${repo}`);
				const { data: newIssue } = await octokit.rest.issues.create({
					owner,
					repo,
					title,
					body,
				});
				console.log(`>>> createIssue tool: Successfully created issue #${newIssue.number} in ${owner}/${repo}`);
				return {
					content: [{ type: "text", text: `Successfully created issue #${newIssue.number}: ${newIssue.html_url}` }]
				};
			} catch (error) {
				console.error(`>>> createIssue tool: Error creating issue in ${owner}/${repo}:`, error);
				return {
					content: [{ type: "text", text: `Error creating issue in ${owner}/${repo}: ${error instanceof Error ? error.message : String(error)}`}]
				}
			}
		}
	);

	// --- Tool: Get Repository Contents ---
	server.tool(
		"getRepoContents",
		"List files and directories at a specific path within a repository",
		{
			owner: z.string().describe("The owner of the repository (user or organization)"),
			repo: z.string().describe("The name of the repository"),
			path: z.string().optional().default("").describe("The path to list contents from (e.g., 'src/components' or leave empty for root)"),
		},
		async ({ owner, repo, path }) => {
			try {
				console.log(`>>> getRepoContents tool: Fetching contents for ${owner}/${repo} at path '${path || '/'}'.`);
				const { data: contents } = await octokit.rest.repos.getContent({
					owner,
					repo,
					path,
				});

				let responseText = `Contents of ${owner}/${repo}${path ? `/${path}` : ''}:\n`;
				if (Array.isArray(contents)) {
					responseText += contents.map(item => `- [${item.type}] ${item.name}`).join('\n');
				} else if (contents && typeof contents === 'object' && 'type' in contents) {
					// If path points directly to a file
					responseText += `- [${contents.type}] ${contents.name}`; 
				} else {
					responseText = `No contents found or unexpected response for ${owner}/${repo}${path ? `/${path}` : ''}.`;
				}

				console.log(`>>> getRepoContents tool: Successfully fetched contents for ${owner}/${repo} at path '${path || '/'}'.`);
				return {
					content: [{ type: "text", text: responseText }]
				};
			} catch (error) {
				console.error(`>>> getRepoContents tool: Error fetching contents for ${owner}/${repo} at path '${path || '/'}':`, error);
				return {
					content: [{ type: "text", text: `Error fetching contents for ${owner}/${repo}${path ? `/${path}` : '/'}: ${error instanceof Error ? error.message : String(error)}`}]
				}
			}
		}
	);

	// --- Tool: Get Repository README ---
	server.tool(
		"getRepoReadme",
		"Get the content of the README file for a repository",
		{
			owner: z.string().describe("The owner of the repository (user or organization)"),
			repo: z.string().describe("The name of the repository"),
		},
		async ({ owner, repo }) => {
			try {
				console.log(`>>> getRepoReadme tool: Fetching README for ${owner}/${repo}`);
				const { data: readme } = await octokit.rest.repos.getReadme({
					owner,
					repo,
				});

				const readmeContent = Buffer.from(readme.content, 'base64').toString('utf8');
				console.log(`>>> getRepoReadme tool: Successfully fetched and decoded README for ${owner}/${repo}`);
				return {
					// Return the decoded README content. Might be long!
					content: [{ type: "text", text: `README for ${owner}/${repo}:\n\n${readmeContent}` }]
				};
			} catch (error) {
				// Handle 404 specifically for README not found
				// Check if error is an object and has a status property before accessing it
				if (typeof error === 'object' && error !== null && 'status' in error && (error as any).status === 404) {
					console.log(`>>> getRepoReadme tool: No README found for ${owner}/${repo}`);
					return {
						content: [{ type: "text", text: `No README file found for ${owner}/${repo}.` }]
					};
				}
				console.error(`>>> getRepoReadme tool: Error fetching README for ${owner}/${repo}:`, error);
				return {
					content: [{ type: "text", text: `Error fetching README for ${owner}/${repo}: ${error instanceof Error ? error.message : String(error)}`}]
				}
			}
		}
	);

	// --- Tool: Get Issue Details ---
	server.tool(
		"getIssue",
		"Get detailed information for a specific issue by number",
		{
			owner: z.string().describe("The owner of the repository (user or organization)"),
			repo: z.string().describe("The name of the repository"),
			issue_number: z.number().int().positive().describe("The number of the issue"),
		},
		async ({ owner, repo, issue_number }) => {
			try {
				console.log(`>>> getIssue tool: Fetching details for issue #${issue_number} in ${owner}/${repo}`);
				const { data: issue } = await octokit.rest.issues.get({
					owner,
					repo,
					issue_number,
				});
				console.log(`>>> getIssue tool: Successfully fetched issue #${issue_number}`);
				// Return the full issue object as formatted JSON
				return {
					content: [{ type: "text", text: JSON.stringify(issue, null, 2) }]
				};
			} catch (error) {
				console.error(`>>> getIssue tool: Error fetching issue #${issue_number} in ${owner}/${repo}:`, error);
				return {
					content: [{ type: "text", text: `Error fetching issue #${issue_number} in ${owner}/${repo}: ${error instanceof Error ? error.message : String(error)}`}]
				}
			}
		}
	);

	// --- Tool: Create Comment on Issue/PR ---
	server.tool(
		"createComment",
		"Add a comment to a specific issue or pull request",
		{
			owner: z.string().describe("The owner of the repository (user or organization)"),
			repo: z.string().describe("The name of the repository"),
			issue_number: z.number().int().positive().describe("The number of the issue or pull request"),
			body: z.string().min(1).describe("The content of the comment"),
		},
		async ({ owner, repo, issue_number, body }) => {
			try {
				console.log(`>>> createComment tool: Adding comment to issue/PR #${issue_number} in ${owner}/${repo}`);
				const { data: comment } = await octokit.rest.issues.createComment({
					owner,
					repo,
					issue_number,
					body,
				});
				console.log(`>>> createComment tool: Successfully added comment ${comment.id} to issue/PR #${issue_number}`);
				return {
					content: [{ type: "text", text: `Successfully added comment: ${comment.html_url}` }]
				};
			} catch (error) {
				console.error(`>>> createComment tool: Error adding comment to issue/PR #${issue_number} in ${owner}/${repo}:`, error);
				return {
					content: [{ type: "text", text: `Error adding comment to #${issue_number} in ${owner}/${repo}: ${error instanceof Error ? error.message : String(error)}`}]
				}
			}
		}
	);

	// --- Tool: Update Issue State ---
	server.tool(
		"updateIssueState",
		"Update the state of an issue (open or closed)",
		{
			owner: z.string().describe("The owner of the repository (user or organization)"),
			repo: z.string().describe("The name of the repository"),
			issue_number: z.number().int().positive().describe("The number of the issue"),
			state: z.enum(["open", "closed"]).describe("The desired state for the issue ('open' or 'closed')"),
		},
		async ({ owner, repo, issue_number, state }) => {
			try {
				console.log(`>>> updateIssueState tool: Setting state of issue #${issue_number} in ${owner}/${repo} to '${state}'`);
				const { data: updatedIssue } = await octokit.rest.issues.update({
					owner,
					repo,
					issue_number,
					state,
				});
				console.log(`>>> updateIssueState tool: Successfully updated state of issue #${issue_number} to '${updatedIssue.state}'`);
				return {
					content: [{ type: "text", text: `Successfully set state of issue #${updatedIssue.number} to '${updatedIssue.state}'. URL: ${updatedIssue.html_url}` }]
				};
			} catch (error) {
				console.error(`>>> updateIssueState tool: Error updating state for issue #${issue_number} in ${owner}/${repo}:`, error);
				return {
					content: [{ type: "text", text: `Error updating state for issue #${issue_number} in ${owner}/${repo}: ${error instanceof Error ? error.message : String(error)}`}]
				}
			}
		}
	);

	// --- Tool: List Pull Requests ---
	server.tool(
		"listPullRequests",
		"List pull requests for a specific repository",
		{
			owner: z.string().describe("The owner of the repository (user or organization)"),
			repo: z.string().describe("The name of the repository"),
			state: z.enum(["open", "closed", "all"]).optional().default("open").describe("Filter by pull request state (open, closed, all)"),
			// Additional useful filters: head (branch), base (branch)
		},
		async ({ owner, repo, state }) => {
			try {
				console.log(`>>> listPullRequests tool: Fetching ${state} pull requests for ${owner}/${repo}`);
				const prs = await octokit.paginate(octokit.rest.pulls.list, {
					owner,
					repo,
					state,
					per_page: 50, // Limit pagination results
				});
				
				const prList = prs.map(pr => `#${pr.number}: ${pr.title} (${pr.state}) by @${pr.user?.login}`);
				const responseText = prList.length > 0 
					? `${state.toUpperCase()} pull requests for ${owner}/${repo}:\n - ${prList.join('\n - ')}` 
					: `No ${state} pull requests found for ${owner}/${repo}.`;

				console.log(`>>> listPullRequests tool: Found ${prList.length} ${state} pull requests for ${owner}/${repo}.`);
				return {
					content: [{ type: "text", text: responseText }]
				};
			} catch (error) {
				console.error(`>>> listPullRequests tool: Error fetching pull requests for ${owner}/${repo}:`, error);
				return {
					content: [{ type: "text", text: `Error fetching pull requests for ${owner}/${repo}: ${error instanceof Error ? error.message : String(error)}`}]
				}
			}
		}
	);

	// --- Tool: Get Pull Request Details ---
	server.tool(
		"getPullRequest",
		"Get detailed information for a specific pull request by number",
		{
			owner: z.string().describe("The owner of the repository (user or organization)"),
			repo: z.string().describe("The name of the repository"),
			pull_number: z.number().int().positive().describe("The number of the pull request"),
		},
		async ({ owner, repo, pull_number }) => {
			try {
				console.log(`>>> getPullRequest tool: Fetching details for PR #${pull_number} in ${owner}/${repo}`);
				const { data: pr } = await octokit.rest.pulls.get({
					owner,
					repo,
					pull_number,
				});
				console.log(`>>> getPullRequest tool: Successfully fetched PR #${pull_number}`);
				// Return the full PR object as formatted JSON
				return {
					content: [{ type: "text", text: JSON.stringify(pr, null, 2) }]
				};
			} catch (error) {
				console.error(`>>> getPullRequest tool: Error fetching PR #${pull_number} in ${owner}/${repo}:`, error);
				return {
					content: [{ type: "text", text: `Error fetching pull request #${pull_number} in ${owner}/${repo}: ${error instanceof Error ? error.message : String(error)}`}]
				}
			}
		}
	);

	// --- Tool: Get Repository File Content ---
	server.tool(
		"getRepoFileContent",
		"Get the content of a specific file within a repository",
		{
			owner: z.string().describe("The owner of the repository (user or organization)"),
			repo: z.string().describe("The name of the repository"),
			path: z.string().describe("The path to the file within the repository (e.g., 'src/index.js')"),
		},
		async ({ owner, repo, path }) => {
			try {
				console.log(`>>> getRepoFileContent tool: Fetching content for file '${path}' in ${owner}/${repo}`);
				const { data: fileData } = await octokit.rest.repos.getContent({
					owner,
					repo,
					path,
				});

				// Check if the response is for a file and has content
				if (Array.isArray(fileData) || fileData.type !== 'file' || typeof fileData.content !== 'string') {
					console.warn(`>>> getRepoFileContent tool: Path '${path}' in ${owner}/${repo} is not a file or content is missing.`);
					throw new Error(`Path '${path}' is not a file or content is unavailable.`);
				}

				const fileContent = Buffer.from(fileData.content, 'base64').toString('utf8');
				console.log(`>>> getRepoFileContent tool: Successfully fetched and decoded content for '${path}'`);
				
				// Return the decoded file content. Could be large!
				// Consider adding truncation or summarization for very large files in the future.
				return {
					content: [{ type: "text", text: `Content of ${owner}/${repo}/${path}:\n\n${fileContent}` }]
				};
			} catch (error) {
				console.error(`>>> getRepoFileContent tool: Error fetching file content for '${path}' in ${owner}/${repo}:`, error);
				return {
					content: [{ type: "text", text: `Error fetching file content for '${path}' in ${owner}/${repo}: ${error instanceof Error ? error.message : String(error)}`}]
				}
			}
		}
	);

	// --- Tool: Search GitHub Code ---
	server.tool(
		"searchGitHubCode",
		"Search for code within GitHub repositories using GitHub's standard search query syntax (e.g., 'myFunction repo:owner/repo path:src language:typescript')",
		{
			query: z.string().describe("The search query. Use GitHub's search syntax: https://docs.github.com/en/search-github/searching-on-github/searching-code"),
			per_page: z.number().int().positive().max(100).optional().default(10).describe("Results per page (max 100, default 10)"),
			page: z.number().int().positive().optional().default(1).describe("Page number of the results (default 1)"),
		},
		async ({ query, per_page, page }) => {
			try {
				console.log(`>>> searchGitHubCode tool: Searching code with query: '${query}', page: ${page}, per_page: ${per_page}`);
				const { data: searchResult } = await octokit.rest.search.code({
					q: query,
					per_page,
					page,
				});

				const totalCount = searchResult.total_count;
				const items = searchResult.items;

				let responseText = `Found ${totalCount} code results for query: '${query}' (showing page ${page} of ${Math.ceil(totalCount / per_page)}):\n\n`;

				if (items.length === 0) {
					responseText = `No code results found for query: '${query}' on page ${page}.`;
				} else {
					responseText += items.map(item => 
						`- ${item.repository.full_name}/${item.path} (Score: ${item.score?.toFixed(2) ?? 'N/A'})\n  URL: ${item.html_url}`
					).join('\n\n');
				}

				console.log(`>>> searchGitHubCode tool: Successfully executed search. Found ${items.length} items on this page.`);
				return {
					content: [{ type: "text", text: responseText }]
				};
			} catch (error) {
				console.error(`>>> searchGitHubCode tool: Error searching code with query '${query}':`, error);
				return {
					content: [{ type: "text", text: `Error searching code: ${error instanceof Error ? error.message : String(error)}`}]
				}
			}
		}
	);

	// Add more GitHub tools here...

	// Remove or comment out the placeholder example if desired
	/*
	server.tool(
		"listRepos",
		// ... rest of example ...
	);
	*/

	// console.log(">>> GitHub tools registration (placeholder). Ready to add specific tools."); // Can remove this log now
} 