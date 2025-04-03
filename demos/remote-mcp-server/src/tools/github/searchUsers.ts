import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Octokit } from "octokit";

const sortOptions = z.enum(["followers", "repositories", "joined", "best-match"]).optional().default("best-match");
const orderOptions = z.enum(["asc", "desc"]).optional().default("desc");

export function registerSearchUsersTool(server: McpServer, octokit: Octokit) {
    server.tool(
        "searchUsersGitHub",
        "Search for users and organizations across GitHub using user search syntax.",
        {
            query: z.string().describe("Search query using user search syntax (e.g., 'nkulavic type:user'). See: https://docs.github.com/en/search-github/searching-on-github/searching-users"),
            sort: sortOptions.describe("Sort field (followers, repositories, joined, best-match)"),
            order: orderOptions.describe("Sort order (asc, desc)"),
            per_page: z.number().int().positive().max(100).optional().default(10).describe("Results per page (max 100, default 10)"),
            page: z.number().int().positive().optional().default(1).describe("Page number of the results (default 1)"),
        },
        async ({ query, sort, order, per_page, page }) => {
            try {
                console.log(`>>> searchUsers tool: Searching users with query: '${query}', sort: ${sort}, order: ${order}, page: ${page}, per_page: ${per_page}`);
                // Handle API default for best-match
                const apiSort = sort === "best-match" ? undefined : sort;

                const { data: searchResult } = await octokit.rest.search.users({
                    q: query,
                    sort: apiSort,
                    order,
                    per_page,
                    page,
                });

                const totalCount = searchResult.total_count;
                const items = searchResult.items;
                const totalPages = Math.ceil(totalCount / per_page);

                let responseText = `Found ${totalCount} users/orgs for query: '${query}' (showing page ${page} of ${totalPages}):\n\n`;

                if (items.length === 0) {
                    responseText = `No users or orgs found for query: '${query}' on page ${page}.`;
                } else {
                    responseText += items.map(item => 
                        `- ${item.login} (${item.type})\n  Score: ${item.score?.toFixed(2) ?? 'N/A'}\n  URL: ${item.html_url}`
                    ).join('\n\n');
                }

                console.log(`>>> searchUsers tool: Successfully executed search. Found ${items.length} items on this page.`);
                return {
                    content: [{ type: "text", text: responseText }]
                };
            } catch (error) {
                console.error(`>>> searchUsers tool: Error searching users with query '${query}':`, error);
                return {
                    content: [{ type: "text", text: `Error searching users/orgs: ${error instanceof Error ? error.message : String(error)}`}]
                }
            }
        }
    );
} 