import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ChemistApiClient } from "../client/index.js";

export function registerSystemTools(server: McpServer, client: ChemistApiClient): void {
  server.tool(
    "get_platform_status",
    "Get overall platform health, catalog entity counts, embedding coverage stats, and active LLM configuration.",
    {},
    async () => {
      try {
        const status = await client.getStatus();
        return {
          content: [{ type: "text", text: JSON.stringify(status, null, 2) }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to get platform status: ${err.message || String(err)}` }]
        };
      }
    }
  );

  server.tool(
    "get_settings",
    "Get embedding completion metrics for Molecules and FunctionalGroups, active embedding/LLM parameters, and context window presets.",
    {},
    async () => {
      try {
        const settings = await client.getSettings();
        return {
          content: [{ type: "text", text: JSON.stringify(settings, null, 2) }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to get settings: ${err.message || String(err)}` }]
        };
      }
    }
  );

  server.tool(
    "update_context_window",
    "Dynamically update the active LLM context window token size.",
    {
      context_window: z
        .number()
        .int()
        .positive()
        .describe("New context window size in tokens (e.g. 65536, 131072, 262144)")
    },
    async ({ context_window }) => {
      try {
        const settings = await client.updateContextWindow(context_window);
        return {
          content: [{ type: "text", text: JSON.stringify(settings, null, 2) }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to update context window: ${err.message || String(err)}` }]
        };
      }
    }
  );

  server.tool(
    "trigger_bulk_embeddings",
    "Enqueue bulk embedding generation for all Molecules or FunctionalGroups.",
    {
      model_type: z
        .enum(["Molecule", "FunctionalGroup"])
        .describe("Entity type to generate embeddings for: Molecule or FunctionalGroup"),
      only_missing: z
        .boolean()
        .optional()
        .default(true)
        .describe("If true, only generate embeddings for records that are not yet embedded")
    },
    async ({ model_type, only_missing }) => {
      try {
        const res = await client.generateBulkEmbeddings(model_type, only_missing);
        return {
          content: [{ type: "text", text: JSON.stringify(res, null, 2) }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to trigger bulk embeddings: ${err.message || String(err)}` }]
        };
      }
    }
  );

  server.tool(
    "get_openapi_spec",
    "Retrieve the raw OpenAPI 3.1 specification for the Chemist API.",
    {},
    async () => {
      try {
        const spec = await client.getOpenApiSpec();
        return {
          content: [{ type: "text", text: JSON.stringify(spec, null, 2) }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to get OpenAPI spec: ${err.message || String(err)}` }]
        };
      }
    }
  );
}
