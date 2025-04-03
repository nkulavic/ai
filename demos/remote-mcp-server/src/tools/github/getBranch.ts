import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Octokit } from "octokit";

export function registerGetBranchTool(server: McpServer, octokit: Octokit) {
    server.tool(
        "getBranch",
        "Get details for a specific branch",
        {
            owner: z.string().describe("The owner of the repository"),
            repo: z.string().describe("The name of the repository"),
            branch: z.string().describe("The name of the branch"),
        },
        async ({ owner, repo, branch }) => {
            try {
                console.log(`>>> getBranch tool: Fetching details for branch '${branch}' in ${owner}/${repo}`);
                const { data: branchData } = await octokit.rest.repos.getBranch({
                    owner,
                    repo,
                    branch,
                });
                console.log(`>>> getBranch tool: Successfully fetched branch '${branch}'`);
                // Return the full branch object as formatted JSON
                return {
                    content: [{ type: "text", text: JSON.stringify(branchData, null, 2) }]
                };
            } catch (error) {
                console.error(`>>> getBranch tool: Error fetching branch '${branch}' in ${owner}/${repo}:`, error);
                return {
                    content: [{ type: "text", text: `Error fetching branch '${branch}': ${error instanceof Error ? error.message : String(error)}`}]
                }
            }
        }
    );
} 