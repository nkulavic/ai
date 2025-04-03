import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Octokit } from "octokit";

export function registerGetCommitTool(server: McpServer, octokit: Octokit) {
    server.tool(
        "getCommit",
        "Get details for a specific commit SHA",
        {
            owner: z.string().describe("The owner of the repository"),
            repo: z.string().describe("The name of the repository"),
            commit_sha: z.string().describe("The SHA of the commit"),
        },
        async ({ owner, repo, commit_sha }) => {
            try {
                console.log(`>>> getCommit tool: Fetching commit ${commit_sha} from ${owner}/${repo}`);
                const { data: commit } = await octokit.rest.repos.getCommit({
                    owner,
                    repo,
                    ref: commit_sha, // API uses 'ref' for commit SHA
                });
                console.log(`>>> getCommit tool: Successfully fetched commit ${commit_sha}`);
                // Return the full commit object as formatted JSON
                return {
                    content: [{ type: "text", text: JSON.stringify(commit, null, 2) }]
                };
            } catch (error) {
                console.error(`>>> getCommit tool: Error fetching commit ${commit_sha} from ${owner}/${repo}:`, error);
                return {
                    content: [{ type: "text", text: `Error fetching commit ${commit_sha}: ${error instanceof Error ? error.message : String(error)}`}]
                }
            }
        }
    );
} 