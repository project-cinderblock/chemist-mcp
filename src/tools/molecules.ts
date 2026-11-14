import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ChemistApiClient } from "../client/index.js";

export function registerMoleculeTools(server: McpServer, client: ChemistApiClient): void {
  server.tool(
    "list_molecules",
    "List molecules registered in Chemist with filtering by chemical class, themes, embedding status, and search keywords.",
    {
      chemical_class_id: z.number().int().positive().optional().describe("Filter molecules by Chemical Class ID"),
      chemical_class: z.string().optional().describe("Filter molecules by Chemical Class name"),
      theme: z.string().optional().describe("Filter molecules containing a specific theme tag"),
      q: z.string().optional().describe("Search query matching molecule name or description"),
      embedded: z.boolean().optional().describe("Filter by embedding presence (true for embedded only, false for missing)"),
      include_functional_groups: z.boolean().optional().default(false).describe("Include child functional groups in results"),
      include_embedding: z.boolean().optional().default(false).describe("Include raw 1024-float vector embedding"),
      limit: z.number().int().min(1).max(500).optional().default(50).describe("Pagination limit (default: 50)"),
      offset: z.number().int().min(0).optional().default(0).describe("Pagination offset (default: 0)")
    },
    async ({ chemical_class_id, chemical_class, theme, q, embedded, include_functional_groups, include_embedding, limit, offset }) => {
      try {
        const result = await client.listMolecules({
          chemical_class_id,
          chemical_class,
          theme,
          q,
          embedded,
          include_functional_groups,
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
          content: [{ type: "text", text: `Failed to list molecules: ${err.message || String(err)}` }]
        };
      }
    }
  );

  server.tool(
    "get_molecule",
    "Retrieve details of a single molecule including its chemical class and child functional groups.",
    {
      id: z.number().int().positive().describe("Molecule ID"),
      include_embedding: z.boolean().optional().default(false).describe("Include raw 1024-float vector embedding"),
      include_functional_groups: z.boolean().optional().default(true).describe("Include child functional groups")
    },
    async ({ id, include_embedding, include_functional_groups }) => {
      try {
        const molecule = await client.getMolecule(id, { include_embedding, include_functional_groups });
        return {
          content: [{ type: "text", text: JSON.stringify(molecule, null, 2) }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to get molecule ${id}: ${err.message || String(err)}` }]
        };
      }
    }
  );

  server.tool(
    "create_molecule",
    "Create a new molecule record in Chemist.",
    {
      chemical_class_id: z.number().int().positive().describe("Parent Chemical Class ID"),
      name: z.string().min(1).describe("Molecule name (e.g. 'Morphine', 'Quinine', 'Taxol')"),
      description: z.string().optional().describe("Chemical description, biosynthesis, or pharmacological mechanism"),
      themes: z.array(z.string()).optional().describe("Stereoelectronic or biological theme tags (e.g. ['analgesic', 'opioid', 'isoquinoline'])")
    },
    async ({ chemical_class_id, name, description, themes }) => {
      try {
        const molecule = await client.createMolecule({ chemical_class_id, name, description, themes });
        return {
          content: [{ type: "text", text: JSON.stringify(molecule, null, 2) }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to create molecule: ${err.message || String(err)}` }]
        };
      }
    }
  );

  server.tool(
    "update_molecule",
    "Update an existing molecule's attributes (name, description, themes, or parent chemical class).",
    {
      id: z.number().int().positive().describe("Molecule ID"),
      name: z.string().optional().describe("Updated molecule name"),
      description: z.string().optional().describe("Updated chemical description"),
      themes: z.array(z.string()).optional().describe("Updated theme tags"),
      chemical_class_id: z.number().int().positive().optional().describe("Reassign to another Chemical Class ID")
    },
    async ({ id, name, description, themes, chemical_class_id }) => {
      try {
        const molecule = await client.updateMolecule(id, { name, description, themes, chemical_class_id });
        return {
          content: [{ type: "text", text: JSON.stringify(molecule, null, 2) }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to update molecule ${id}: ${err.message || String(err)}` }]
        };
      }
    }
  );

  server.tool(
    "delete_molecule",
    "Delete a molecule and its cascaded functional groups.",
    {
      id: z.number().int().positive().describe("Molecule ID to delete")
    },
    async ({ id }) => {
      try {
        const res = await client.deleteMolecule(id);
        return {
          content: [{ type: "text", text: JSON.stringify(res, null, 2) }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to delete molecule ${id}: ${err.message || String(err)}` }]
        };
      }
    }
  );

  server.tool(
    "upsert_molecules_batch",
    "Batch insert or update molecules under a specific chemical class matching on lower(name).",
    {
      chemical_class_id: z.number().int().positive().describe("Parent Chemical Class ID"),
      molecules: z
        .array(
          z.object({
            name: z.string().min(1),
            description: z.string().optional(),
            themes: z.array(z.string()).optional()
          })
        )
        .min(1)
        .describe("Array of molecules to upsert")
    },
    async ({ chemical_class_id, molecules }) => {
      try {
        const result = await client.upsertMoleculesBatch(chemical_class_id, molecules);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to upsert molecules: ${err.message || String(err)}` }]
        };
      }
    }
  );

  server.tool(
    "generate_molecule_embedding",
    "Generate or regenerate a 1024-dimensional semantic embedding vector for a single molecule.",
    {
      id: z.number().int().positive().describe("Molecule ID"),
      sync: z.boolean().optional().default(true).describe("If true, wait synchronously for vector generation to finish")
    },
    async ({ id, sync }) => {
      try {
        const result = await client.generateMoleculeEmbedding(id, sync);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to generate embedding for molecule ${id}: ${err.message || String(err)}` }]
        };
      }
    }
  );

  server.tool(
    "populate_molecule_functional_groups",
    "Discover and populate functional groups and reactive motifs for a molecule via LLM analysis.",
    {
      id: z.number().int().positive().describe("Molecule ID"),
      sync: z.boolean().optional().default(true).describe("If true, wait synchronously for functional group discovery to finish")
    },
    async ({ id, sync }) => {
      try {
        const result = await client.populateMoleculeFunctionalGroups(id, sync);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to populate functional groups for molecule ${id}: ${err.message || String(err)}` }]
        };
      }
    }
  );

  server.tool(
    "populate_molecules_bulk",
    "Bulk trigger discovery of molecules across one or all chemical classes via background job.",
    {
      chemical_class_id: z.number().int().positive().optional().describe("Optional Chemical Class ID to limit molecule discovery"),
      sync: z.boolean().optional().default(false).describe("If true, run synchronously")
    },
    async ({ chemical_class_id, sync }) => {
      try {
        const result = await client.populateMolecules(chemical_class_id, sync);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to bulk populate molecules: ${err.message || String(err)}` }]
        };
      }
    }
  );
}
