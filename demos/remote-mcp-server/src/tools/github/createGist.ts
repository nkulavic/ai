import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Octokit } from "octokit";

// Define the structure for the files object
const fileSchema = z.object({ 
    content: z.string().describe("The content of the file")
}).describe("An object where keys are filenames and values are objects with a 'content' property");

export function registerCreateGistTool(server: McpServer, octokit: Octokit) {
    server.tool(
        "createGistGitHub",
        "Create a new public or private Gist",
        {
            description: z.string().optional().describe("A description for the Gist"),
            files: z.record(fileSchema).describe("An object where keys are filenames and values have a 'content' string property"),
            public: z.boolean().optional().default(false).describe("Whether the Gist should be public (default: false)"),
        },
        async ({ description, files, public: isPublic }) => {
            try {
                console.log(`>>> createGist tool: Creating a ${isPublic ? 'public' : 'private'} Gist${description ? ` with description '${description}'` : ''}`);
                
                // The Octokit API expects files in the format { 'filename.txt': { content: '...' } }
                // Our input schema `z.record(fileSchema)` already matches this structure.
                
                const { data: gist } = await octokit.rest.gists.create({
                    description,
                    files: files as any, // Cast to any needed here because Octokit's type is slightly stricter than Zod's record
                    public: isPublic,
                });

                console.log(`>>> createGist tool: Successfully created Gist ${gist.id}`);
                return {
                    content: [{ type: "text", text: `Successfully created Gist: ${gist.html_url}` }]
                };
            } catch (error) {
                console.error(`>>> createGist tool: Error creating Gist:`, error);
                return {
                    content: [{ type: "text", text: `Error creating Gist: ${error instanceof Error ? error.message : String(error)}`}]
                }
            }
        }
    );
} 