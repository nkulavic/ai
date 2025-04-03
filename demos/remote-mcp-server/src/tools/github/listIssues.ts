import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Octokit } from "octokit";

export function registerListIssuesTool(server: McpServer, octokit: Octokit) {
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
} 