import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Octokit } from "octokit";

// Note: Commit search sort options are limited
const sortOptions = z.enum(["author-date", "committer-date"]).optional(); // Default is best-match
const orderOptions = z.enum(["asc", "desc"]).optional().default("desc");

export function registerSearchCommitsTool(server: McpServer, octokit: Octokit) {
    server.tool(
        "searchCommitsGitHub",
        "Search for commits across GitHub using commit search syntax. Limited to default branch unless repo specified.",
        {
            query: z.string().describe("Search query using commit search syntax (e.g., 'fix: handle redirect repo:owner/repo'). See: https://docs.github.com/en/search-github/searching-on-github/searching-commits"),
            sort: sortOptions.describe("Sort field (author-date, committer-date) - Defaults to best-match if not specified"),
            order: orderOptions.describe("Sort order (asc, desc)"),
            per_page: z.number().int().positive().max(100).optional().default(10).describe("Results per page (max 100, default 10)"),
            page: z.number().int().positive().optional().default(1).describe("Page number of the results (default 1)"),
        },
        async ({ query, sort, order, per_page, page }) => {
            try {
                console.log(`>>> searchCommits tool: Searching commits with query: '${query}', sort: ${sort || 'best-match'}, order: ${order}, page: ${page}, per_page: ${per_page}`);
                
                const { data: searchResult } = await octokit.rest.search.commits({
                    q: query,
                    sort,
                    order,
                    per_page,
                    page,
                });

                const totalCount = searchResult.total_count;
                const items = searchResult.items;
                const totalPages = Math.ceil(totalCount / per_page);

                let responseText = `Found ${totalCount} commits for query: '${query}' (showing page ${page} of ${totalPages}):\n\n`;

                if (items.length === 0) {
                    responseText = `No commits found for query: '${query}' on page ${page}.`;
                } else {
                    responseText += items.map(item => 
                        `- ${item.sha.substring(0, 7)}: ${item.commit.message.split('\n')[0]}\n  Repo: ${item.repository.full_name} | Author: ${item.commit.author?.name || item.author?.login || 'Unknown'}\n  URL: ${item.html_url}`
                    ).join('\n\n');
                }

                console.log(`>>> searchCommits tool: Successfully executed search. Found ${items.length} items on this page.`);
                return {
                    content: [{ type: "text", text: responseText }]
                };
            } catch (error) {
                console.error(`>>> searchCommits tool: Error searching commits with query '${query}':`, error);
                // GitHub commit search API sometimes returns 422 for complex queries
                const message = (error instanceof Error && (error as any).status === 422) 
                    ? `Error searching commits (query might be too complex or malformed): ${(error as Error).message}`
                    : `Error searching commits: ${error instanceof Error ? error.message : String(error)}`;
                return {
                    content: [{ type: "text", text: message}]
                }
            }
        }
    );
} 