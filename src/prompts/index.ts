import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerPrompts(server: McpServer): void {
  server.prompt(
    "comparative_chemical_analysis",
    "Prompt template for comparing two molecules or functional groups across chemical classes using stereoelectronic attributes, biosynthetic pathways, and semantic manifold distance.",
    {
      entity_a: z.string().describe("First molecule or functional group name (e.g. 'Morphine' or 'Phenolic Hydroxyl')"),
      entity_b: z.string().describe("Second molecule or functional group name (e.g. 'Codeine' or 'Methoxy Group')"),
      entity_type: z
        .enum(["molecule", "functional_group"])
        .optional()
        .default("molecule")
        .describe("Entity type to compare: molecule or functional_group (default: molecule)"),
      focus_theme: z
        .string()
        .optional()
        .describe("Optional thematic lens (e.g. 'bioisosteric substitution', 'blood-brain barrier permeability', 'metabolic clearance pathway')")
    },
    ({ entity_a, entity_b, entity_type = "molecule", focus_theme }) => {
      const themeInstruction = focus_theme
        ? `Focus specifically through the thematic lens of: "${focus_theme}".`
        : "Analyze shared biosynthetic pathways, stereoelectronic properties, reactive motifs, and structural archetype convergence.";

      const detailTool = entity_type === "functional_group" ? "get_functional_group" : "get_molecule";

      return {
        description: `Comparative chemical analysis of ${entity_a} vs. ${entity_b}`,
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text:
                `Please conduct a rigorous comparative chemical and pharmacological analysis between ${entity_a} and ${entity_b} (${entity_type}) using the Chemist computational framework.\n\n` +
                `1. Query Chemist using the 'search' and '${detailTool}' tools to retrieve their structured profiles, thematic tags, and chemical class context.\n` +
                `2. Use 'find_counterparts' (entity_type='${entity_type}') to examine where each falls on the 1024-dimensional pgvector cosine distance manifold.\n` +
                `3. ${themeInstruction}\n` +
                `4. Cite specific thematic tags, reactive parameters, cosine distances, and cross-class structural parallels.`
            }
          }
        ]
      };
    }
  );

  server.prompt(
    "chemical_cluster_monograph",
    "Prompt template to draft an academic chemical treatise based on Chemist archetype clusters and frozen snapshots.",
    {
      snapshot_id: z.string().describe("ID of the frozen cluster snapshot to synthesize"),
      thematic_prompt: z.string().describe("Chemical, medicinal, or biosynthetic research inquiry to address")
    },
    ({ snapshot_id, thematic_prompt }) => {
      return {
        description: `Chemical synthesis monograph based on Snapshot #${snapshot_id}`,
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text:
                `You are an expert medicinal and computational organic chemist specializing in natural products, bioisosteric design, and molecular manifold synthesis.\n\n` +
                `Research Inquiry: "${thematic_prompt}"\n\n` +
                `1. Inspect cluster snapshot #${snapshot_id} using 'get_cluster_snapshot' or resource 'chemist://snapshots/${snapshot_id}'.\n` +
                `2. Examine the discovered archetype cluster groups, shared stereoelectronic themes, and constituent molecules or functional groups.\n` +
                `3. Check if any synthesis reports exist via 'list_cluster_reports' or initiate a new report via 'create_cluster_report' (and optionally 'generate_deep_synthesis').\n` +
                `4. Compose an academic monograph synthesizing the cross-class patterns with formal citations to cluster numbers and member chemical entities.`
            }
          }
        ]
      };
    }
  );
}
