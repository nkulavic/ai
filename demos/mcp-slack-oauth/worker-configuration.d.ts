// Generated by Wrangler by running `wrangler types`

interface Env {
	OAUTH_KV: KVNamespace;
	SLACK_CLIENT_ID: string;
	SLACK_CLIENT_SECRET: string;
	MCP_OBJECT: DurableObjectNamespace<import("./src/index").SlackMCP>;
  }