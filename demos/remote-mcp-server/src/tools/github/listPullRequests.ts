import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Octokit } from "octokit";

export function registerListPullRequestsTool(server: McpServer, octokit: Octokit) {
    server.tool(
        "listPullRequestsGitHub",
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
} 