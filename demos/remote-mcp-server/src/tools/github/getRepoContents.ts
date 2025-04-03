import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Octokit } from "octokit";

export function registerGetRepoContentsTool(server: McpServer, octokit: Octokit) {
    server.tool(
        "getRepoContents",
        "List files and directories at a specific path within a repository",
        {
            owner: z.string().describe("The owner of the repository (user or organization)"),
            repo: z.string().describe("The name of the repository"),
            path: z.string().optional().default("").describe("The path to list contents from (e.g., 'src/components' or leave empty for root)"),
        },
        async ({ owner, repo, path }) => {
            try {
                console.log(`>>> getRepoContents tool: Fetching contents for ${owner}/${repo} at path '${path || '/'}'.`);
                const { data: contents } = await octokit.rest.repos.getContent({
                    owner,
                    repo,
                    path,
                });

                let responseText = `Contents of ${owner}/${repo}${path ? `/${path}` : ''}:\n`;
                if (Array.isArray(contents)) {
                    responseText += contents.map(item => `- [${item.type}] ${item.name}`).join('\n');
                } else if (contents && typeof contents === 'object' && 'type' in contents) {
                    // If path points directly to a file
                    const fileInfo = contents as { type: string; name: string };
                    responseText += `- [${fileInfo.type}] ${fileInfo.name}`; 
                } else {
                    responseText = `No contents found or unexpected response for ${owner}/${repo}${path ? `/${path}` : ''}.`;
                }

                console.log(`>>> getRepoContents tool: Successfully fetched contents for ${owner}/${repo} at path '${path || '/'}'.`);
                return {
                    content: [{ type: "text", text: responseText }]
                };
            } catch (error) {
                console.error(`>>> getRepoContents tool: Error fetching contents for ${owner}/${repo} at path '${path || '/'}':`, error);
                return {
                    content: [{ type: "text", text: `Error fetching contents for ${owner}/${repo}${path ? `/${path}` : '/'}: ${error instanceof Error ? error.message : String(error)}`}]
                }
            }
        }
    );
} 