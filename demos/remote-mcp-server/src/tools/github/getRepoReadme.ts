import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Octokit } from "octokit";
import { Buffer } from 'node:buffer'; // Needed for base64 decoding

export function registerGetRepoReadmeTool(server: McpServer, octokit: Octokit) {
    server.tool(
        "getRepoReadme",
        "Get the content of the README file for a repository",
        {
            owner: z.string().describe("The owner of the repository (user or organization)"),
            repo: z.string().describe("The name of the repository"),
        },
        async ({ owner, repo }) => {
            try {
                console.log(`>>> getRepoReadme tool: Fetching README for ${owner}/${repo}`);
                const { data: readme } = await octokit.rest.repos.getReadme({
                    owner,
                    repo,
                });

                const readmeContent = Buffer.from(readme.content, 'base64').toString('utf8');
                console.log(`>>> getRepoReadme tool: Successfully fetched and decoded README for ${owner}/${repo}`);
                return {
                    // Return the decoded README content. Might be long!
                    content: [{ type: "text", text: `README for ${owner}/${repo}:\n\n${readmeContent}` }]
                };
            } catch (error) {
                // Handle 404 specifically for README not found
                // Check if error is an object and has a status property before accessing it
                if (typeof error === 'object' && error !== null && 'status' in error && (error as any).status === 404) {
                    console.log(`>>> getRepoReadme tool: No README found for ${owner}/${repo}`);
                    return {
                        content: [{ type: "text", text: `No README file found for ${owner}/${repo}.` }]
                    };
                }
                console.error(`>>> getRepoReadme tool: Error fetching README for ${owner}/${repo}:`, error);
                return {
                    content: [{ type: "text", text: `Error fetching README for ${owner}/${repo}: ${error instanceof Error ? error.message : String(error)}`}]
                }
            }
        }
    );
} 