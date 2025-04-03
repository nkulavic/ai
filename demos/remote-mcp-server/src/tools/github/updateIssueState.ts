import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Octokit } from "octokit";

export function registerUpdateIssueStateTool(server: McpServer, octokit: Octokit) {
    server.tool(
        "updateIssueStateGitHub",
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
} 