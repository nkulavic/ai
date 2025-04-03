import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Octokit } from "octokit";
import OAuthProvider from "@cloudflare/workers-oauth-provider";
import { GitHubHandler } from "./github-handler";
import { Buffer } from 'node:buffer';

// --- Define Types --- //
// Context from the auth process, encrypted & stored in the auth token
// and provided to the DurableMCP as this.props
type Props = {
	login: string;
	name: string;
	email: string;
	accessToken: string;
};

// Define Env bindings needed by MyMCP and its tools
type Env = {
	AI: Ai;
	// Add other bindings if needed, e.g., OAUTH_KV, GITHUB_CLIENT_ID etc. if accessed directly in MyMCP
};
// --- End Define Types --- //

// --- Define Constants --- //
// Removed ALLOWED_USERNAMES constant
// const ALLOWED_USERNAMES = new Set<string>([
// 	// Add GitHub usernames of users who should have access to the image generation tool
// 	// For example: 'yourusername', 'coworkerusername'
// ]);
// --- End Define Constants --- //

export class MyMCP extends McpAgent<Props, Env> {
	server = new McpServer({
		name: "Github OAuth Proxy Demo",
		version: "1.0.0",
	});

	async init() {
		console.log(">>> MyMCP init started. Props:", this.props);

		// Check if props exist before accessing them
		const login = this.props?.login;
		const accessToken = this.props?.accessToken;

		if (!login || !accessToken) {
			console.warn(">>> MyMCP init: Props (login/accessToken) are missing. Some tools may not initialize.");
		} else {
			console.log(`>>> MyMCP init: Initializing tools for user ${login}`);
		}

		// Hello, world!
		this.server.tool(
			"add",
			"Add two numbers the way only MCP can",
			{ a: z.number(), b: z.number() },
			async ({ a, b }) => ({
				content: [{ type: "text", text: String(a + b) }],
			}),
		);

		// userInfoOctokit tool
		if (accessToken) {
			this.server.tool(
				"userInfoOctokit",
				"Get user info from GitHub, via Octokit",
				{},
				async () => {
					try {
						const octokit = new Octokit({ auth: accessToken });
						const userInfo = await octokit.rest.users.getAuthenticated();
						console.log(">>> MyMCP userInfoOctokit: Fetched user info");
						return {
							content: [
								{
									type: "text",
									text: JSON.stringify(userInfo.data),
								},
							],
						};
					} catch (error) {
						console.error(">>> MyMCP userInfoOctokit: Error fetching user info:", error);
						return {
							content: [{ type: "text", text: `Error fetching GitHub user info: ${error instanceof Error ? error.message : String(error)}`}]
						}
					}
				},
			);
		} else {
			 console.warn(">>> MyMCP init: Skipping userInfoOctokit tool initialization due to missing accessToken.");
		}

		// generateImage tool - Initialize if user is logged in (login prop exists)
		if (login) {
			console.log(`>>> MyMCP init: User ${login} authenticated. Initializing generateImage tool.`);
			this.server.tool(
				"generateImage",
				"Generate an image using the `flux-1-schnell` model. Works best with 8 steps.",
				{
					prompt: z
						.string()
						.describe("A text description of the image you want to generate."),
					steps: z
						.number()
						.min(4)
						.max(8)
						.default(4)
						.describe(
							"The number of diffusion steps; higher values can improve quality but take longer. Must be between 4 and 8, inclusive.",
						),
				},
				async ({ prompt, steps }) => {
					try {
						// Ensure env.AI is available
						if (!(this.env as Env)?.AI) {
							 console.error(">>> MyMCP generateImage: AI binding is not available in env.");
							 throw new Error("AI binding not configured.");
						}
						console.log(`>>> MyMCP generateImage: Generating image with prompt "${prompt}" for user ${login}`);
						const response = await (this.env as Env).AI.run("@cf/black-forest-labs/flux-1-schnell", {
							prompt,
							steps,
						}) as { image?: ArrayBuffer };

						// Check if image data exists
						if (!response.image) {
							console.error(">>> MyMCP generateImage: AI run did not return image data.");
							throw new Error("AI failed to generate image data.");
						}

						// Convert ArrayBuffer to base64 string
						const imageBase64 = Buffer.from(response.image).toString('base64');

						return {
							content: [{ type: "image", data: imageBase64, mimeType: "image/jpeg" }],
						};
					} catch (error) {
						 console.error(">>> MyMCP generateImage: Error generating image:", error);
						 return {
							content: [{ type: "text", text: `Error generating image: ${error instanceof Error ? error.message : String(error)}`}]
						}
					}
				},
			);
		} else {
			 console.log(`>>> MyMCP init: User not authenticated (login missing). Skipping generateImage tool initialization.`);
		}
		console.log(">>> MyMCP init finished.");
	}
}

// Remove the incorrect app.route call:
// app.route('/sse', MyMCP.mount('/sse'));

// Export the correctly configured OAuthProvider
export default new OAuthProvider({
	apiRoute: "/sse",
	// Use 'as any' for type compatibility workaround
	apiHandler: MyMCP.mount('/sse') as any,
	defaultHandler: GitHubHandler as any,
	authorizeEndpoint: "/authorize",
	// Add required endpoints, even if unused by our GitHub flow
	tokenEndpoint: "/token", // Required by type
	clientRegistrationEndpoint: "/register", // Required by type
});