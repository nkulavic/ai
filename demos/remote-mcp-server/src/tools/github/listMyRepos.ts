import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Octokit } from "octokit";

export function registerListMyReposTool(server: McpServer, octokit: Octokit) {
    server.tool(
        "listMyRepos",
        "List repositories for the authenticated user",
        {},
        async () => {
            try {
                console.log(`>>> listMyRepos tool: Fetching repositories for authenticated user`);
                const repos = await octokit.paginate(octokit.rest.repos.listForAuthenticatedUser, {
                    type: 'owner', // List repos owned by the authenticated user
                    per_page: 100 // Fetch up to 100 per page (adjust as needed)
                });
                
                const repoNames = repos.map(repo => repo.full_name);
                console.log(`>>> listMyRepos tool: Found ${repoNames.length} repositories.`);
                
                return {
                    content: [{ type: "text", text: `Repositories owned by you:\n - ${repoNames.join('\n - ')}` }]
                };
            } catch (error) {
                console.error(`>>> listMyRepos tool: Error fetching repositories:`, error);
                return {
                    content: [{ type: "text", text: `Error fetching repositories: ${error instanceof Error ? error.message : String(error)}`}]
                }
            }
        }
    );
} 