import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Octokit } from "octokit";

// Helper function to format results for each type
const formatCodeResults = (items: any[]) => items.map(item => 
    `- ${item.repository.full_name}/${item.path} (Score: ${item.score?.toFixed(2) ?? 'N/A'})\n  URL: ${item.html_url}`
).join('\n\n');

const formatIssuesAndPRsResults = (items: any[]) => items.map(item => 
    `- #${item.number}: ${item.title} (${item.state}) [${item.pull_request ? 'PR' : 'Issue'}] by @${item.user?.login}\n  URL: ${item.html_url}`
).join('\n\n');

const formatRepoResults = (items: any[]) => items.map(item => 
    `- ${item.full_name}: ${item.description ? item.description.substring(0, 100) + (item.description.length > 100 ? '...' : '') : 'No description'}\n  ⭐ ${item.stargazers_count} | Forks: ${item.forks_count} | Lang: ${item.language || 'N/A'}\n  URL: ${item.html_url}`
).join('\n\n');

const formatCommitResults = (items: any[]) => items.map(item => 
    `- ${item.sha.substring(0, 7)}: ${item.commit.message.split('\n')[0]}\n  Repo: ${item.repository.full_name} | Author: ${item.commit.author?.name || item.author?.login || 'Unknown'}\n  URL: ${item.html_url}`
).join('\n\n');

const formatUserResults = (items: any[]) => items.map(item => 
    `- ${item.login} (${item.type})\n  Score: ${item.score?.toFixed(2) ?? 'N/A'}\n  URL: ${item.html_url}`
).join('\n\n');

export function registerSearchGitHubTool(server: McpServer, octokit: Octokit) {
    server.tool(
        "searchGitHub",
        "Search GitHub across selected types (code, issues, repos, commits, users) using a single query string.",
        {
            query: z.string().describe("The search query string. Note: Syntax effectiveness varies by search type."),
            searchCode: z.boolean().optional().default(true).describe("Include code search results."),
            searchIssuesAndPRs: z.boolean().optional().default(true).describe("Include issue and pull request search results."),
            searchRepositories: z.boolean().optional().default(true).describe("Include repository search results."),
            searchCommits: z.boolean().optional().default(false).describe("Include commit search results (can be slow/noisy)."),
            searchUsers: z.boolean().optional().default(false).describe("Include user/org search results."),
            maxResultsPerType: z.number().int().positive().optional().default(5).describe("Maximum results to return *per enabled search type*."),
        },
        async ({ 
            query, 
            searchCode, 
            searchIssuesAndPRs, 
            searchRepositories, 
            searchCommits, 
            searchUsers,
            maxResultsPerType 
        }) => {
            const searchPromises: Promise<any>[] = [];
            const searchTypes: string[] = [];

            console.log(`>>> searchGitHub tool: Starting search for query '${query}' with max ${maxResultsPerType} results per type.`);

            // Add promises for enabled searches
            if (searchCode) { 
                searchTypes.push('Code');
                searchPromises.push(octokit.rest.search.code({ q: query, per_page: maxResultsPerType })); 
            }
            if (searchIssuesAndPRs) { 
                searchTypes.push('IssuesAndPRs');
                searchPromises.push(octokit.rest.search.issuesAndPullRequests({ q: query, per_page: maxResultsPerType })); 
            }
            if (searchRepositories) { 
                searchTypes.push('Repositories');
                searchPromises.push(octokit.rest.search.repos({ q: query, per_page: maxResultsPerType })); 
            }
            if (searchCommits) { 
                searchTypes.push('Commits');
                searchPromises.push(octokit.rest.search.commits({ q: query, per_page: maxResultsPerType })); 
            }
            if (searchUsers) { 
                searchTypes.push('Users');
                searchPromises.push(octokit.rest.search.users({ q: query, per_page: maxResultsPerType })); 
            }

            if (searchPromises.length === 0) {
                return { content: [{ type: "text", text: "No search types were enabled." }] };
            }

            try {
                const results = await Promise.allSettled(searchPromises);
                let combinedResponse = `Combined GitHub Search Results for query: '${query}'\n(Showing up to ${maxResultsPerType} results per selected type)\n`;
                const errors: string[] = [];

                results.forEach((result, index) => {
                    const type = searchTypes[index];
                    combinedResponse += `\n--- ${type} Results ---\n`;

                    if (result.status === 'fulfilled') {
                        const data = result.value.data;
                        const items = data.items || [];
                        const totalCount = data.total_count || 0;
                        
                        combinedResponse += `(Total found by API: ${totalCount})\n`;
                        if (items.length === 0) {
                            combinedResponse += `No results found.\n`;
                        } else {
                            switch (type) {
                                case 'Code': combinedResponse += formatCodeResults(items) + '\n'; break;
                                case 'IssuesAndPRs': combinedResponse += formatIssuesAndPRsResults(items) + '\n'; break;
                                case 'Repositories': combinedResponse += formatRepoResults(items) + '\n'; break;
                                case 'Commits': combinedResponse += formatCommitResults(items) + '\n'; break;
                                case 'Users': combinedResponse += formatUserResults(items) + '\n'; break;
                            }
                        }
                    } else {
                        console.error(`>>> searchGitHub tool: Error during ${type} search:`, result.reason);
                        const errorMsg = result.reason instanceof Error ? result.reason.message : String(result.reason);
                        combinedResponse += `Error searching ${type}: ${errorMsg}\n`;
                        errors.push(`Failed to search ${type}: ${errorMsg}`);
                    }
                });

                if (errors.length > 0) {
                     combinedResponse += `\n--- Search Errors ---\n${errors.join('\n')}\n`;
                }

                console.log(`>>> searchGitHub tool: Finished combined search for '${query}'.`);
                return { content: [{ type: "text", text: combinedResponse.trim() }] };

            } catch (error) {
                console.error(`>>> searchGitHub tool: Unexpected error during combined search for query '${query}':`, error);
                return {
                    content: [{ type: "text", text: `Unexpected error during combined search: ${error instanceof Error ? error.message : String(error)}` }]
                }
            }
        }
    );
} 