import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// Define a function to register the 'add' tool
export function registerAddTool(server: McpServer) {
	server.tool(
		"add",
		"Add two numbers the way only MCP can",
		{ a: z.number(), b: z.number() },
		async ({ a, b }) => ({
			content: [{ type: "text", text: String(a + b) }],
		}),
	);
} 