import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Octokit } from "octokit";

const sortOptions = z.enum(["stars", "forks", "help-wanted-issues", "updated", "best-match"]).optional().default("best-match");
const orderOptions = z.enum(["asc", "desc"]).optional().default("desc");

export function registerSearchRepositoriesTool(server: McpServer, octokit: Octokit) {
    server.tool(
        "searchRepositoriesGitHub",
        "Search for repositories across GitHub using repository search syntax.",
        {
            query: z.string().describe("Search query using repository search syntax (e.g., 'mcp-server language:typescript'). See: https://docs.github.com/en/search-github/searching-on-github/searching-for-repositories"),
            sort: sortOptions.describe("Sort field (stars, forks, help-wanted-issues, updated, best-match)"),
            order: orderOptions.describe("Sort order (asc, desc)"),
            per_page: z.number().int().positive().max(100).optional().default(10).describe("Results per page (max 100, default 10)"),
            page: z.number().int().positive().optional().default(1).describe("Page number of the results (default 1)"),
        },
        async ({ query, sort, order, per_page, page }) => {
            try {
                console.log(`>>> searchRepositories tool: Searching repos with query: '${query}', sort: ${sort}, order: ${order}, page: ${page}, per_page: ${per_page}`);
                // Handle API default for best-match
                const apiSort = sort === "best-match" ? undefined : sort;
                
                const { data: searchResult } = await octokit.rest.search.repos({
                    q: query,
                    sort: apiSort,
                    order,
                    per_page,
                    page,
                });

                const totalCount = searchResult.total_count;
                const items = searchResult.items;
                const totalPages = Math.ceil(totalCount / per_page);

                let responseText = `Found ${totalCount} repositories for query: '${query}' (showing page ${page} of ${totalPages}):\n\n`;

                if (items.length === 0) {
                    responseText = `No repositories found for query: '${query}' on page ${page}.`;
                } else {
                    responseText += items.map(item => 
                        `- ${item.full_name}: ${item.description ? item.description.substring(0, 100) + (item.description.length > 100 ? '...' : '') : 'No description'}\n  ⭐ ${item.stargazers_count} | Forks: ${item.forks_count} | Lang: ${item.language || 'N/A'}\n  URL: ${item.html_url}`
                    ).join('\n\n');
                }

                console.log(`>>> searchRepositories tool: Successfully executed search. Found ${items.length} items on this page.`);
                return {
                    content: [{ type: "text", text: responseText }]
                };
            } catch (error) {
                console.error(`>>> searchRepositories tool: Error searching repos with query '${query}':`, error);
                return {
                    content: [{ type: "text", text: `Error searching repositories: ${error instanceof Error ? error.message : String(error)}`}]
                }
            }
        }
    );
} 