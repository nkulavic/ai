import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Octokit } from "octokit";

export function registerCreateIssueTool(server: McpServer, octokit: Octokit) {
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
} 