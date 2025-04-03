import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Octokit } from "octokit";
import { Buffer } from 'node:buffer'; // Needed for base64 decoding

export function registerGetRepoFileContentTool(server: McpServer, octokit: Octokit) {
    server.tool(
        "getRepoFileContent",
        "Get the content of a specific file within a repository",
        {
            owner: z.string().describe("The owner of the repository (user or organization)"),
            repo: z.string().describe("The name of the repository"),
            path: z.string().describe("The path to the file within the repository (e.g., 'src/index.js')"),
        },
        async ({ owner, repo, path }) => {
            try {
                console.log(`>>> getRepoFileContent tool: Fetching content for file '${path}' in ${owner}/${repo}`);
                const { data: fileData } = await octokit.rest.repos.getContent({
                    owner,
                    repo,
                    path,
                });

                // Check if the response is for a file and has content
                if (Array.isArray(fileData) || !('type' in fileData) || fileData.type !== 'file' || typeof fileData.content !== 'string') {
                    console.warn(`>>> getRepoFileContent tool: Path '${path}' in ${owner}/${repo} is not a file or content is missing.`);
                    throw new Error(`Path '${path}' is not a file or content is unavailable.`);
                }

                const fileContent = Buffer.from(fileData.content, 'base64').toString('utf8');
                console.log(`>>> getRepoFileContent tool: Successfully fetched and decoded content for '${path}'`);
                
                // Return the decoded file content. Could be large!
                // Consider adding truncation or summarization for very large files in the future.
                return {
                    content: [{ type: "text", text: `Content of ${owner}/${repo}/${path}:\n\n${fileContent}` }]
                };
            } catch (error) {
                console.error(`>>> getRepoFileContent tool: Error fetching file content for '${path}' in ${owner}/${repo}:`, error);
                return {
                    content: [{ type: "text", text: `Error fetching file content for '${path}' in ${owner}/${repo}: ${error instanceof Error ? error.message : String(error)}`}]
                }
            }
        }
    );
} 