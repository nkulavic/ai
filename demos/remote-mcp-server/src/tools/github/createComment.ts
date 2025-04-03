import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Octokit } from "octokit";

export function registerCreateCommentTool(server: McpServer, octokit: Octokit) {
    server.tool(
        "createCommentGitHub",
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
} 