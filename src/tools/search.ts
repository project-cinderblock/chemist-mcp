import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ChemistApiClient } from "../client/index.js";

export function registerSearchTools(server: McpServer, client: ChemistApiClient): void {
  server.tool(
    "search",
    "Unified cross-catalog semantic or keyword search across molecules and functional groups in the Chemist comparative chemistry manifold.",
    {
      q: z.string().describe("Search query text (e.g. 'alkaloid neurotoxin with indole core', 'terpene biosynthesis intermediate')"),
      mode: z.enum(["semantic", "keyword", "auto"]).optional().default("auto").describe("Search mode: semantic (pgvector cosine similarity), keyword (text matching), or auto"),
      target_type: z.enum(["all", "molecule", "functional_group"]).optional().default("all").describe("Filter search results by entity type: all, molecule, or functional_group"),
      limit: z.number().int().min(1).max(100).optional().default(20).describe("Maximum number of results to return (1-100)")
    },
    async ({ q, mode, target_type, limit }) => {
      try {
        const results = await client.search({ q, mode, target_type, limit });
        return {
          content: [{ type: "text", text: JSON.stringify(results, null, 2) }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Search failed: ${err.message || String(err)}` }]
        };
      }
    }
  );

  server.tool(
    "find_counterparts",
    "Find nearest chemical counterparts or bioisosteric analogs to a specified molecule or functional group using 1024-dimensional pgvector cosine distance.",
    {
      entity_type: z.enum(["molecule", "functional_group"]).describe("Entity type to find counterparts for: molecule or functional_group"),
      id: z.number().int().positive().describe("ID of the molecule or functional group"),
      limit: z.number().int().min(1).max(100).optional().default(10).describe("Number of nearest neighbors to return (default: 10)"),
      chemical_class_id: z.number().int().positive().optional().describe("Optional chemical class ID to filter counterpart candidates"),
      molecule_id: z.number().int().positive().optional().describe("Optional molecule ID to filter counterpart candidates (for functional group counterparts)"),
      include_embedding: z.boolean().optional().default(false).describe("Whether to include raw 1024-float vector embeddings in results")
    },
    async ({ entity_type, id, limit, chemical_class_id, molecule_id, include_embedding }) => {
      try {
        if (entity_type === "molecule") {
          const neighbors = await client.getMoleculeNeighbors(id, { limit, chemical_class_id, include_embedding });
          return {
            content: [{ type: "text", text: JSON.stringify(neighbors, null, 2) }]
          };
        } else {
          const neighbors = await client.getFunctionalGroupNeighbors(id, { limit, molecule_id, chemical_class_id, include_embedding });
          return {
            content: [{ type: "text", text: JSON.stringify(neighbors, null, 2) }]
          };
        }
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Finding counterparts failed: ${err.message || String(err)}` }]
        };
      }
    }
  );
}
