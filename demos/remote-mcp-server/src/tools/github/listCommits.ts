import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Octokit } from "octokit";

export function registerListCommitsTool(server: McpServer, octokit: Octokit) {
    server.tool(
        "listCommitsGitHub",
        "Get recent commit history for a branch in a repository",
        {
            owner: z.string().describe("The owner of the repository"),
            repo: z.string().describe("The name of the repository"),
            branch: z.string().optional().describe("Branch name (defaults to the repository's default branch)"),
            per_page: z.number().int().positive().max(100).optional().default(10).describe("Results per page (max 100, default 10)"),
            page: z.number().int().positive().optional().default(1).describe("Page number of the results (default 1)"),
        },
        async ({ owner, repo, branch, per_page, page }) => {
            try {
                console.log(`>>> listCommits tool: Fetching commits for ${owner}/${repo}${branch ? ` on branch ${branch}` : ''}, page: ${page}, per_page: ${per_page}`);
                const { data: commits } = await octokit.rest.repos.listCommits({
                    owner,
                    repo,
                    sha: branch, // API uses 'sha' parameter for branch/tag/commit
                    per_page,
                    page,
                });

                const commitList = commits.map(commit => 
                    `- ${commit.sha.substring(0, 7)}: ${commit.commit.message.split('\n')[0]} (by ${commit.commit.author?.name || commit.author?.login || 'Unknown'})`
                );
                const responseText = commitList.length > 0 
                    ? `Commits for ${owner}/${repo}${branch ? ` (branch: ${branch})` : ''} (Page ${page}):\n${commitList.join('\n')}` 
                    : `No commits found for ${owner}/${repo}${branch ? ` on branch ${branch}` : ''} on page ${page}.`;

                console.log(`>>> listCommits tool: Found ${commitList.length} commits.`);
                return {
                    content: [{ type: "text", text: responseText }]
                };
            } catch (error) {
                console.error(`>>> listCommits tool: Error fetching commits for ${owner}/${repo}:`, error);
                return {
                    content: [{ type: "text", text: `Error fetching commits: ${error instanceof Error ? error.message : String(error)}`}]
                }
            }
        }
    );
} 