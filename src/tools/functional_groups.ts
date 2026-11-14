import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ChemistApiClient } from "../client/index.js";

export function registerFunctionalGroupTools(server: McpServer, client: ChemistApiClient): void {
  server.tool(
    "list_functional_groups",
    "List functional groups and reactive motifs registered in Chemist with filtering by molecule, chemical class, themes, and embedding status.",
    {
      molecule_id: z.number().int().positive().optional().describe("Filter by parent Molecule ID"),
      chemical_class_id: z.number().int().positive().optional().describe("Filter by parent Chemical Class ID"),
      theme: z.string().optional().describe("Filter by reactive motif or stereoelectronic theme tag"),
      q: z.string().optional().describe("Search query matching functional group name or description"),
      embedded: z.boolean().optional().describe("Filter by embedding presence (true for embedded only, false for missing)"),
      include_embedding: z.boolean().optional().default(false).describe("Include raw 1024-float vector embedding"),
      limit: z.number().int().min(1).max(500).optional().default(50).describe("Pagination limit (default: 50)"),
      offset: z.number().int().min(0).optional().default(0).describe("Pagination offset (default: 0)")
    },
    async ({ molecule_id, chemical_class_id, theme, q, embedded, include_embedding, limit, offset }) => {
      try {
        const result = await client.listFunctionalGroups({
          molecule_id,
          chemical_class_id,
          theme,
          q,
          embedded,
          include_embedding,
          limit,
          offset
        });
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to list functional groups: ${err.message || String(err)}` }]
        };
      }
    }
  );

  server.tool(
    "get_functional_group",
    "Retrieve details of a single functional group including parent molecule and chemical class metadata.",
    {
      id: z.number().int().positive().describe("Functional Group ID"),
      include_embedding: z.boolean().optional().default(false).describe("Include raw 1024-float vector embedding")
    },
    async ({ id, include_embedding }) => {
      try {
        const functionalGroup = await client.getFunctionalGroup(id, { include_embedding });
        return {
          content: [{ type: "text", text: JSON.stringify(functionalGroup, null, 2) }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to get functional group ${id}: ${err.message || String(err)}` }]
        };
      }
    }
  );

  server.tool(
    "create_functional_group",
    "Create a new functional group or reactive motif under a molecule.",
    {
      molecule_id: z.number().int().positive().describe("Parent Molecule ID"),
      name: z.string().min(1).describe("Functional group name (e.g. 'Phenolic Hydroxyl', 'Tertiary Amine', 'Epoxide Ring')"),
      description: z.string().optional().describe("Stereoelectronic, pKa, nucleophilicity/electrophilicity, and reactive role description"),
      themes: z.array(z.string()).optional().describe("Thematic tags (e.g. ['hydrogen-bond donor', 'nucleophile', 'metabolic soft spot'])")
    },
    async ({ molecule_id, name, description, themes }) => {
      try {
        const functionalGroup = await client.createFunctionalGroup({ molecule_id, name, description, themes });
        return {
          content: [{ type: "text", text: JSON.stringify(functionalGroup, null, 2) }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to create functional group: ${err.message || String(err)}` }]
        };
      }
    }
  );

  server.tool(
    "update_functional_group",
    "Update an existing functional group's attributes.",
    {
      id: z.number().int().positive().describe("Functional Group ID"),
      name: z.string().optional().describe("Updated functional group name"),
      description: z.string().optional().describe("Updated chemical description"),
      themes: z.array(z.string()).optional().describe("Updated theme tags"),
      molecule_id: z.number().int().positive().optional().describe("Reassign to another Molecule ID")
    },
    async ({ id, name, description, themes, molecule_id }) => {
      try {
        const functionalGroup = await client.updateFunctionalGroup(id, { name, description, themes, molecule_id });
        return {
          content: [{ type: "text", text: JSON.stringify(functionalGroup, null, 2) }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to update functional group ${id}: ${err.message || String(err)}` }]
        };
      }
    }
  );

  server.tool(
    "delete_functional_group",
    "Delete a functional group from the catalog.",
    {
      id: z.number().int().positive().describe("Functional Group ID to delete")
    },
    async ({ id }) => {
      try {
        const res = await client.deleteFunctionalGroup(id);
        return {
          content: [{ type: "text", text: JSON.stringify(res, null, 2) }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to delete functional group ${id}: ${err.message || String(err)}` }]
        };
      }
    }
  );

  server.tool(
    "upsert_functional_groups_batch",
    "Batch insert or update functional groups for a specific molecule matching on lower(name).",
    {
      molecule_id: z.number().int().positive().describe("Parent Molecule ID"),
      functional_groups: z
        .array(
          z.object({
            name: z.string().min(1),
            description: z.string().optional(),
            themes: z.array(z.string()).optional()
          })
        )
        .min(1)
        .describe("Array of functional groups to upsert")
    },
    async ({ molecule_id, functional_groups }) => {
      try {
        const result = await client.upsertFunctionalGroupsBatch(molecule_id, functional_groups);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to upsert functional groups: ${err.message || String(err)}` }]
        };
      }
    }
  );

  server.tool(
    "generate_functional_group_embedding",
    "Generate or regenerate a 1024-dimensional semantic embedding vector for a functional group.",
    {
      id: z.number().int().positive().describe("Functional Group ID"),
      sync: z.boolean().optional().default(true).describe("If true, wait synchronously for vector generation to finish")
    },
    async ({ id, sync }) => {
      try {
        const result = await client.generateFunctionalGroupEmbedding(id, sync);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to generate embedding for functional group ${id}: ${err.message || String(err)}` }]
        };
      }
    }
  );

  server.tool(
    "populate_functional_groups_bulk",
    "Bulk trigger discovery of functional groups across all molecules under an optional molecule scope.",
    {
      molecule_id: z.number().int().positive().optional().describe("Optional Molecule ID to limit functional group discovery"),
      sync: z.boolean().optional().default(false).describe("If true, run synchronously")
    },
    async ({ molecule_id, sync }) => {
      try {
        const result = await client.populateFunctionalGroups(molecule_id, sync);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to bulk populate functional groups: ${err.message || String(err)}` }]
        };
      }
    }
  );
}
