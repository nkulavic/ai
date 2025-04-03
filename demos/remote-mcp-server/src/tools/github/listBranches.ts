import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Octokit } from "octokit";

export function registerListBranchesTool(server: McpServer, octokit: Octokit) {
    server.tool(
        "listBranches",
        "List branches in a repository",
        {
            owner: z.string().describe("The owner of the repository"),
            repo: z.string().describe("The name of the repository"),
            // Add pagination if needed: per_page, page
        },
        async ({ owner, repo }) => {
            try {
                console.log(`>>> listBranches tool: Fetching branches for ${owner}/${repo}`);
                // Use paginate for potentially large number of branches
                const branches = await octokit.paginate(octokit.rest.repos.listBranches, {
                    owner,
                    repo,
                    per_page: 100, // Adjust as needed
                });

                const branchNames = branches.map(branch => branch.name);
                const responseText = branchNames.length > 0 
                    ? `Branches for ${owner}/${repo}:\n - ${branchNames.join('\n - ')}` 
                    : `No branches found for ${owner}/${repo}.`;

                console.log(`>>> listBranches tool: Found ${branchNames.length} branches.`);
                return {
                    content: [{ type: "text", text: responseText }]
                };
            } catch (error) {
                console.error(`>>> listBranches tool: Error fetching branches for ${owner}/${repo}:`, error);
                return {
                    content: [{ type: "text", text: `Error fetching branches: ${error instanceof Error ? error.message : String(error)}`}]
                }
            }
        }
    );
} 