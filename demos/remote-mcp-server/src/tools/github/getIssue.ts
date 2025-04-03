import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Octokit } from "octokit";

export function registerGetIssueTool(server: McpServer, octokit: Octokit) {
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
} 