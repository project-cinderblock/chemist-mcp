#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig, HELP_TEXT } from "./config.js";
import { ChemistApiClient } from "./client/index.js";
import { registerAllTools } from "./tools/index.js";
import { registerResources } from "./resources/index.js";
import { registerPrompts } from "./prompts/index.js";

async function main(): Promise<void> {
  const config = loadConfig();

  if (config.showHelp) {
    process.stdout.write(HELP_TEXT);
    process.exit(0);
  }

  const server = new McpServer(
    {
      name: "chemist",
      version: "1.0.0"
    },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {}
      }
    }
  );

  const client = new ChemistApiClient(config);

  // Register capabilities
  registerAllTools(server, client);
  registerResources(server, client);
  registerPrompts(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  process.stderr.write(
    `[chemist-mcp] Chemist MCP Server v1.0.0 connected via stdio transport\n` +
      `[chemist-mcp] API Base: ${config.apiUrl}\n`
  );
}

main().catch((error) => {
  process.stderr.write(`[chemist-mcp] Fatal error: ${error?.message || error}\n`);
  process.exit(1);
});
