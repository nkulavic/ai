import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Octokit } from "octokit";

export function registerGetPullRequestTool(server: McpServer, octokit: Octokit) {
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
} 