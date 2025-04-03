import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Octokit } from "octokit";

export function registerSearchGitHubCodeTool(server: McpServer, octokit: Octokit) {
    server.tool(
        "searchGitHubCode",
        "Search for code within GitHub repositories using GitHub's standard search query syntax (e.g., 'myFunction repo:owner/repo path:src language:typescript')",
        {
            query: z.string().describe("The search query. Use GitHub's search syntax: https://docs.github.com/en/search-github/searching-on-github/searching-code"),
            per_page: z.number().int().positive().max(100).optional().default(10).describe("Results per page (max 100, default 10)"),
            page: z.number().int().positive().optional().default(1).describe("Page number of the results (default 1)"),
        },
        async ({ query, per_page, page }) => {
            try {
                console.log(`>>> searchGitHubCode tool: Searching code with query: '${query}', page: ${page}, per_page: ${per_page}`);
                const { data: searchResult } = await octokit.rest.search.code({
                    q: query,
                    per_page,
                    page,
                });

                const totalCount = searchResult.total_count;
                const items = searchResult.items;

                let responseText = `Found ${totalCount} code results for query: '${query}' (showing page ${page} of ${Math.ceil(totalCount / per_page)}):\n\n`;

                if (items.length === 0) {
                    responseText = `No code results found for query: '${query}' on page ${page}.`;
                } else {
                    responseText += items.map(item => 
                        `- ${item.repository.full_name}/${item.path} (Score: ${item.score?.toFixed(2) ?? 'N/A'})\n  URL: ${item.html_url}`
                    ).join('\n\n');
                }

                console.log(`>>> searchGitHubCode tool: Successfully executed search. Found ${items.length} items on this page.`);
                return {
                    content: [{ type: "text", text: responseText }]
                };
            } catch (error) {
                console.error(`>>> searchGitHubCode tool: Error searching code with query '${query}':`, error);
                return {
                    content: [{ type: "text", text: `Error searching code: ${error instanceof Error ? error.message : String(error)}`}]
                }
            }
        }
    );
} 