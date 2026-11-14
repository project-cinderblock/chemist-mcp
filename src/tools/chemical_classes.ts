import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ChemistApiClient } from "../client/index.js";

export function registerChemicalClassTools(server: McpServer, client: ChemistApiClient): void {
  server.tool(
    "list_chemical_classes",
    "List chemical classes (superfamilies, biosynthetic families, compound classes) registered in Chemist with molecule counts.",
    {
      q: z.string().optional().describe("Filter chemical classes by name or description substring"),
      include_molecules: z.boolean().optional().default(false).describe("Include molecules associated with each chemical class"),
      limit: z.number().int().min(1).max(500).optional().default(50).describe("Pagination limit (default: 50)"),
      offset: z.number().int().min(0).optional().default(0).describe("Pagination offset (default: 0)")
    },
    async ({ q, include_molecules, limit, offset }) => {
      try {
        const result = await client.listChemicalClasses({ q, include_molecules, limit, offset });
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to list chemical classes: ${err.message || String(err)}` }]
        };
      }
    }
  );

  server.tool(
    "get_chemical_class",
    "Retrieve details of a single chemical class including its molecules.",
    {
      id: z.number().int().positive().describe("Chemical Class ID"),
      include_molecules: z.boolean().optional().default(true).describe("Include molecules belonging to this chemical class")
    },
    async ({ id, include_molecules }) => {
      try {
        const chemicalClass = await client.getChemicalClass(id, { include_molecules });
        return {
          content: [{ type: "text", text: JSON.stringify(chemicalClass, null, 2) }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to get chemical class ${id}: ${err.message || String(err)}` }]
        };
      }
    }
  );

  server.tool(
    "create_chemical_class",
    "Create a new chemical class record in the catalog.",
    {
      name: z.string().min(1).describe("Name of the chemical class (e.g. 'Alkaloids', 'Terpenoids', 'Flavonoids')"),
      description: z.string().optional().describe("Biosynthetic, structural, and chemical description")
    },
    async ({ name, description }) => {
      try {
        const chemicalClass = await client.createChemicalClass({ name, description });
        return {
          content: [{ type: "text", text: JSON.stringify(chemicalClass, null, 2) }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to create chemical class: ${err.message || String(err)}` }]
        };
      }
    }
  );

  server.tool(
    "update_chemical_class",
    "Update an existing chemical class's name or description.",
    {
      id: z.number().int().positive().describe("Chemical Class ID"),
      name: z.string().optional().describe("Updated chemical class name"),
      description: z.string().optional().describe("Updated description")
    },
    async ({ id, name, description }) => {
      try {
        const chemicalClass = await client.updateChemicalClass(id, { name, description });
        return {
          content: [{ type: "text", text: JSON.stringify(chemicalClass, null, 2) }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to update chemical class ${id}: ${err.message || String(err)}` }]
        };
      }
    }
  );

  server.tool(
    "delete_chemical_class",
    "Delete a chemical class and its cascaded molecules and functional groups.",
    {
      id: z.number().int().positive().describe("Chemical Class ID to delete")
    },
    async ({ id }) => {
      try {
        const res = await client.deleteChemicalClass(id);
        return {
          content: [{ type: "text", text: JSON.stringify(res, null, 2) }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to delete chemical class ${id}: ${err.message || String(err)}` }]
        };
      }
    }
  );

  server.tool(
    "upsert_chemical_classes_batch",
    "Batch insert or update chemical classes matching case-insensitively on name.",
    {
      chemical_classes: z
        .array(
          z.object({
            name: z.string().min(1),
            description: z.string().optional()
          })
        )
        .min(1)
        .describe("Array of chemical classes to upsert")
    },
    async ({ chemical_classes }) => {
      try {
        const result = await client.upsertChemicalClassesBatch(chemical_classes);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to upsert chemical classes: ${err.message || String(err)}` }]
        };
      }
    }
  );

  server.tool(
    "populate_chemical_classes",
    "Trigger LLM discovery to populate major chemical classes and superfamilies with biochemical descriptions.",
    {
      sync: z.boolean().optional().default(false).describe("If true, wait synchronously for discovery to complete")
    },
    async ({ sync }) => {
      try {
        const result = await client.populateChemicalClasses(sync);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to populate chemical classes: ${err.message || String(err)}` }]
        };
      }
    }
  );

  server.tool(
    "populate_chemical_class_molecules",
    "Discover and populate molecules for a specific chemical class via LLM generation.",
    {
      id: z.number().int().positive().describe("Chemical Class ID"),
      sync: z.boolean().optional().default(true).describe("If true, wait synchronously for molecule discovery to finish")
    },
    async ({ id, sync }) => {
      try {
        const result = await client.populateChemicalClassMolecules(id, sync);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to populate molecules for chemical class ${id}: ${err.message || String(err)}` }]
        };
      }
    }
  );
}
