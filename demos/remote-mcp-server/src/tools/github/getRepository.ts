import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Octokit } from "octokit";

export function registerGetRepositoryTool(server: McpServer, octokit: Octokit) {
    server.tool(
        "getRepositoryGitHub",
        "Get details for a specific repository",
        {
            owner: z.string().describe("The owner of the repository (user or organization)"),
            repo: z.string().describe("The name of the repository"),
        },
        async ({ owner, repo }) => {
            try {
                console.log(`>>> getRepository tool: Fetching details for ${owner}/${repo}`);
                const { data: repository } = await octokit.rest.repos.get({
                    owner,
                    repo,
                });
                console.log(`>>> getRepository tool: Successfully fetched details for ${owner}/${repo}`);
                return {
                    content: [{ type: "text", text: JSON.stringify(repository, null, 2) }]
                };
            } catch (error) {
                console.error(`>>> getRepository tool: Error fetching repository ${owner}/${repo}:`, error);
                return {
                    content: [{ type: "text", text: `Error fetching repository ${owner}/${repo}: ${error instanceof Error ? error.message : String(error)}` }]
                }
            }
        }
    );
} 