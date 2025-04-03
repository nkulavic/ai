import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Octokit } from "octokit";

// Define Props type (minimal needed)
type Props = { accessToken: string };

// Define a function to register the 'userInfoOctokit' tool
export function registerUserInfoOctokitTool(server: McpServer, props: Props | null) {
	const accessToken = props?.accessToken;

	if (accessToken) {
		console.log(">>> Registering userInfoOctokit tool.");
		server.tool(
			"userInfoOctokit",
			"Get user info from GitHub, via Octokit",
			{},
			async () => {
				try {
					const octokit = new Octokit({ auth: accessToken });
					const userInfo = await octokit.rest.users.getAuthenticated();
					console.log(">>> userInfoOctokit tool: Fetched user info");
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(userInfo.data),
							},
						],
					};
				} catch (error) {
					console.error(">>> userInfoOctokit tool: Error fetching user info:", error);
					return {
						content: [{ type: "text", text: `Error fetching GitHub user info: ${error instanceof Error ? error.message : String(error)}`}]
					}
				}
			},
		);
	} else {
		 console.warn(">>> Skipping userInfoOctokit tool registration due to missing accessToken.");
	}
} 