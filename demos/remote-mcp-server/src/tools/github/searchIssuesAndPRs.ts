import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Octokit } from "octokit";

const sortOptions = z.enum(["created", "updated", "comments", "reactions", "reactions-+1", "reactions--1", "reactions-smile", "reactions-thinking_face", "reactions-heart", "reactions-tada", "interactions"]).optional();
const orderOptions = z.enum(["asc", "desc"]).optional().default("desc");

export function registerSearchIssuesAndPRsTool(server: McpServer, octokit: Octokit) {
    server.tool(
        "searchIssuesAndPRsGitHub",
        "Search for Issues and Pull Requests across GitHub using GitHub issue search syntax.",
        {
            query: z.string().describe("Search query using issue search syntax (e.g., 'fix bug repo:owner/repo state:open'). See: https://docs.github.com/en/search-github/searching-on-github/searching-issues-and-pull-requests"),
            sort: sortOptions.describe("Sort field (created, updated, comments, reactions, interactions, etc.) - Defaults to best-match if not specified"),
            order: orderOptions.describe("Sort order (asc, desc)"),
            per_page: z.number().int().positive().max(100).optional().default(10).describe("Results per page (max 100, default 10)"),
            page: z.number().int().positive().optional().default(1).describe("Page number of the results (default 1)"),
        },
        async ({ query, sort, order, per_page, page }) => {
            try {
                console.log(`>>> searchIssuesAndPRs tool: Searching issues/PRs with query: '${query}', sort: ${sort || 'best-match'}, order: ${order}, page: ${page}, per_page: ${per_page}`);
                const { data: searchResult } = await octokit.rest.search.issuesAndPullRequests({
                    q: query,
                    sort: sort,
                    order,
                    per_page,
                    page,
                });

                const totalCount = searchResult.total_count;
                const items = searchResult.items;
                const totalPages = Math.ceil(totalCount / per_page);

                let responseText = `Found ${totalCount} issues/PRs for query: '${query}' (showing page ${page} of ${totalPages}):\n\n`;

                if (items.length === 0) {
                    responseText = `No issues or PRs found for query: '${query}' on page ${page}.`;
                } else {
                    responseText += items.map(item => 
                        `- #${item.number}: ${item.title} (${item.state}) [${item.pull_request ? 'PR' : 'Issue'}] by @${item.user?.login}\n  URL: ${item.html_url}`
                    ).join('\n\n');
                }

                console.log(`>>> searchIssuesAndPRs tool: Successfully executed search. Found ${items.length} items on this page.`);
                return {
                    content: [{ type: "text", text: responseText }]
                };
            } catch (error) {
                console.error(`>>> searchIssuesAndPRs tool: Error searching issues/PRs with query '${query}':`, error);
                return {
                    content: [{ type: "text", text: `Error searching issues/PRs: ${error instanceof Error ? error.message : String(error)}`}]
                }
            }
        }
    );
} 