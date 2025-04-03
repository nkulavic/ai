import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Octokit } from "octokit";

export function registerListTagsTool(server: McpServer, octokit: Octokit) {
    server.tool(
        "listTags",
        "List tags in a repository",
        {
            owner: z.string().describe("The owner of the repository"),
            repo: z.string().describe("The name of the repository"),
            // Add pagination if needed: per_page, page
        },
        async ({ owner, repo }) => {
            try {
                console.log(`>>> listTags tool: Fetching tags for ${owner}/${repo}`);
                 // Use paginate for potentially large number of tags
                const tags = await octokit.paginate(octokit.rest.repos.listTags, {
                    owner,
                    repo,
                    per_page: 100, // Adjust as needed
                });

                const tagNames = tags.map(tag => tag.name);
                const responseText = tagNames.length > 0 
                    ? `Tags for ${owner}/${repo}:\n - ${tagNames.join('\n - ')}` 
                    : `No tags found for ${owner}/${repo}.`;

                console.log(`>>> listTags tool: Found ${tagNames.length} tags.`);
                return {
                    content: [{ type: "text", text: responseText }]
                };
            } catch (error) {
                console.error(`>>> listTags tool: Error fetching tags for ${owner}/${repo}:`, error);
                return {
                    content: [{ type: "text", text: `Error fetching tags: ${error instanceof Error ? error.message : String(error)}`}]
                }
            }
        }
    );
} 