import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// Define a function to register basic tools
export function registerBasicTools(server: McpServer) {
	// Add tool
	server.tool(
		"add",
		"Add two numbers the way only MCP can",
		{ a: z.number(), b: z.number() },
		async ({ a, b }) => ({
			content: [{ type: "text", text: String(a + b) }],
		}),
	);
	
	// Add more basic tools here in the future if needed
} 