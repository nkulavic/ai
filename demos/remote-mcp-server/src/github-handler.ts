import type { AuthRequest, OAuthHelpers } from "@cloudflare/workers-oauth-provider";
import { Hono } from "hono";
import { Octokit } from "octokit";
import { fetchUpstreamAuthToken, getUpstreamAuthorizeUrl } from "./utils"; // Assuming utils.ts exists

// Define Props type (adjust path if needed)
type Props = {
	login: string;
	name: string;
	email: string;
	accessToken: string;
};

// Define Env type (adjust as needed)
type Env = {
	GITHUB_OAUTH_CLIENT_ID: string;
	GITHUB_OAUTH_CLIENT_SECRET: string;
	OAUTH_PROVIDER: OAuthHelpers;
	OAUTH_KV: KVNamespace; // Assuming you need KV
	// Add other bindings like AI if used in this file
};

const app = new Hono<{ Bindings: Env }>();

/**
 * OAuth Authorization Endpoint
 */
app.get("/authorize", async (c) => {
	const oauthReqInfo = await c.env.OAUTH_PROVIDER.parseAuthRequest(c.req.raw);
	if (!oauthReqInfo?.clientId) { // Added null check
		return c.text("Invalid request", 400);
	}

	const callbackUrl = new URL("/callback", c.req.url).href;
	const state = btoa(JSON.stringify(oauthReqInfo));
	const githubAuthorizeUrl = getUpstreamAuthorizeUrl({
		upstream_url: "https://github.com/login/oauth/authorize",
		scope: "read:user", // Added default scope, adjust if needed
		client_id: c.env.GITHUB_OAUTH_CLIENT_ID,
		redirect_uri: callbackUrl,
		state: state,
	});

	// --- DEBUG LOGGING ---
	console.log(">>> Authorize: Redirecting to GitHub");
	console.log(">>> Authorize: Callback URL sent to GitHub:", callbackUrl);
	console.log(">>> Authorize: Original oauthReqInfo (in state):", JSON.stringify(oauthReqInfo, null, 2));
	// --- END DEBUG LOGGING ---

	return Response.redirect(githubAuthorizeUrl);
});

/**
 * OAuth Callback Endpoint
 */
app.get("/callback", async (c) => {
	const state = c.req.query("state") as string;
	const code = c.req.query("code");

	if (!state) {
		return c.text("Missing state", 400);
	}

	let oauthReqInfo: AuthRequest | null = null;
	try {
		oauthReqInfo = JSON.parse(atob(state)) as AuthRequest;
	} catch (e) {
		console.error(">>> Callback: Failed to parse state:", e);
		return c.text("Invalid state", 400);
	}

	if (!oauthReqInfo?.clientId) { // Added null check
		return c.text("Invalid state content", 400);
	}

	const callbackUrl = new URL("/callback", c.req.url).href; // Recalculate for token exchange

	// --- DEBUG LOGGING ---
	console.log(">>> Callback: Received callback from GitHub");
	console.log(">>> Callback: State param:", state);
	console.log(">>> Callback: Code param:", code);
	console.log(">>> Callback: Parsed oauthReqInfo from state:", JSON.stringify(oauthReqInfo, null, 2));
	console.log(">>> Callback: Callback URL used for token exchange:", callbackUrl);
	// --- END DEBUG LOGGING ---


	// Exchange the code for an access token
	const [accessToken, errResponse] = await fetchUpstreamAuthToken({
		upstream_url: "https://github.com/login/oauth/access_token",
		client_id: c.env.GITHUB_OAUTH_CLIENT_ID,
		client_secret: c.env.GITHUB_OAUTH_CLIENT_SECRET,
		code: code,
		redirect_uri: callbackUrl,
	});

	if (errResponse) {
		console.error(">>> Callback: Failed to fetch upstream token");
		return errResponse;
	}
	if (!accessToken) {
		console.error(">>> Callback: No access token received from upstream");
		return new Response("Failed to obtain access token", { status: 500 });
	}

	// Fetch the user info from GitHub
	let login: string, name: string | null, email: string | null;
	try {
		const octokit = new Octokit({ auth: accessToken });
		const user = await octokit.rest.users.getAuthenticated();
		login = user.data.login;
		name = user.data.name;
		email = user.data.email; // Note: email might be null if not public
		console.log(">>> Callback: Fetched GitHub user:", { login, name, email });
	} catch (error) {
		console.error(">>> Callback: Failed to fetch user info from GitHub:", error);
		return new Response("Failed to fetch user info from GitHub", { status: 500 });
	}

	// Return back to the MCP client a new token
	try {
		// --- DEBUG LOGGING ---
		console.log(">>> Callback: Calling completeAuthorization with oauthReqInfo:", JSON.stringify(oauthReqInfo, null, 2));
		// --- END DEBUG LOGGING ---
		const { redirectTo } = await c.env.OAUTH_PROVIDER.completeAuthorization({
			request: oauthReqInfo,
			userId: login,
			metadata: {
				label: name ?? login, // Use login if name is null
			},
			scope: oauthReqInfo.scope,
			props: {
				login,
				name: name ?? login,
				email: email ?? '', // Use empty string if email is null
				accessToken,
			} as Props,
		});

		console.log(">>> Callback: completeAuthorization successful. Redirecting browser to:", redirectTo);
		return Response.redirect(redirectTo);

	} catch (error) {
		console.error(">>> Callback: Error during completeAuthorization:", error);
		// Log the problematic redirectUri if possible
		if (oauthReqInfo?.redirectUri) {
			console.error(">>> Callback: oauthReqInfo.redirectUri was:", oauthReqInfo.redirectUri);
		}
		// Provide a more informative error page if possible
		return new Response(`Internal Server Error during OAuth completion: ${error instanceof Error ? error.message : String(error)}`, { status: 500 });
	}
});

export const GitHubHandler = app; 