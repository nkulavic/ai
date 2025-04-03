import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Octokit } from "octokit";

export function registerPreviewPullRequestTool(server: McpServer, octokit: Octokit) {
    server.tool(
        "previewPullRequestGitHub",
        "Get a preview of changes in a pull request, including files changed and diff statistics",
        {
            owner: z.string().describe("The owner of the repository (user or organization)"),
            repo: z.string().describe("The name of the repository"),
            pull_number: z.number().int().positive().describe("The number of the pull request"),
        },
        async ({ owner, repo, pull_number }) => {
            try {
                console.log(`>>> previewPullRequest tool: Fetching preview for PR #${pull_number} in ${owner}/${repo}`);
                
                // Get PR details
                const { data: pr } = await octokit.rest.pulls.get({
                    owner,
                    repo,
                    pull_number,
                });

                // Get the files changed in the PR
                const { data: files } = await octokit.rest.pulls.listFiles({
                    owner,
                    repo,
                    pull_number,
                });

                // Build the response
                let responseText = `Pull Request #${pull_number}: ${pr.title}\n`;
                responseText += `Status: ${pr.state.toUpperCase()}\n`;
                responseText += `Author: @${pr.user?.login}\n`;
                responseText += `Branch: ${pr.head.ref} → ${pr.base.ref}\n`;
                responseText += `\nChanges Overview:\n`;
                responseText += `- Total Files Changed: ${files.length}\n`;
                responseText += `- Additions: +${pr.additions}\n`;
                responseText += `- Deletions: -${pr.deletions}\n`;
                
                responseText += `\nFiles Changed:\n`;
                files.forEach(file => {
                    responseText += `- ${file.filename}\n`;
                    responseText += `  Changes: +${file.additions}/-${file.deletions} (${file.status})\n`;
                    if (file.patch) {
                        // Add a snippet of the patch if available (first few lines)
                        const patchLines = file.patch.split('\n').slice(0, 3);
                        responseText += `  Preview:\n    ${patchLines.join('\n    ')}\n`;
                        if (file.patch.split('\n').length > 3) {
                            responseText += `    ...\n`;
                        }
                    }
                });

                responseText += `\nLinks:\n`;
                responseText += `- View Full PR: ${pr.html_url}\n`;
                responseText += `- View Changes: ${pr.html_url}/files\n`;
                responseText += `- View Discussion: ${pr.html_url}/conversation\n`;

                console.log(`>>> previewPullRequest tool: Successfully generated preview for PR #${pull_number}`);
                return {
                    content: [{ type: "text", text: responseText }]
                };
            } catch (error) {
                console.error(`>>> previewPullRequest tool: Error previewing PR #${pull_number} in ${owner}/${repo}:`, error);
                return {
                    content: [{ type: "text", text: `Error previewing PR #${pull_number} in ${owner}/${repo}: ${error instanceof Error ? error.message : String(error)}`}]
                }
            }
        }
    );
} 