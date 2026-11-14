import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ChemistApiClient } from "../client/index.js";

export function registerReportTools(server: McpServer, client: ChemistApiClient): void {
  server.tool(
    "list_cluster_reports",
    "List generated multi-phase comparative chemistry and molecular manifold synthesis reports.",
    {
      cluster_snapshot_id: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Filter reports for a specific cluster snapshot ID"),
      target_type: z
        .enum(["Molecule", "FunctionalGroup"])
        .optional()
        .describe("Filter by target entity type: Molecule or FunctionalGroup"),
      status: z
        .enum(["queued", "running", "completed", "failed", "pending"])
        .optional()
        .describe("Filter by report generation status"),
      is_detailed: z
        .boolean()
        .optional()
        .describe("Filter by whether report is a 3-phase detailed deep synthesis"),
      limit: z.number().int().min(1).max(100).optional().default(20).describe("Pagination limit"),
      offset: z.number().int().min(0).optional().default(0).describe("Pagination offset")
    },
    async (params) => {
      try {
        const result = await client.listClusterReports(params);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to list cluster reports: ${err.message || String(err)}` }]
        };
      }
    }
  );

  server.tool(
    "get_cluster_report",
    "Retrieve complete scholarly chemistry report content, progress percentage, markdown monograph, and intermediate summaries.",
    {
      id: z.number().int().positive().describe("Cluster Report ID"),
      include_summaries: z.boolean().optional().default(true).describe("Include Phase 1 individual cluster summaries"),
      include_sub_reports: z.boolean().optional().default(true).describe("Include Phase 2 intermediate batch syntheses")
    },
    async ({ id, include_summaries, include_sub_reports }) => {
      try {
        const report = await client.getClusterReport(id, { include_summaries, include_sub_reports });
        return {
          content: [{ type: "text", text: JSON.stringify(report, null, 2) }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to get cluster report ${id}: ${err.message || String(err)}` }]
        };
      }
    }
  );

  server.tool(
    "create_cluster_report",
    "Initiate a 2-Phase Map-Reduce synthesis report on a frozen cluster snapshot.",
    {
      cluster_snapshot_id: z.number().int().positive().describe("Cluster Snapshot ID"),
      prompt: z
        .string()
        .min(1)
        .describe("Scholarly chemical investigation prompt (e.g. 'Investigate stereoelectronic motifs, biosynthetic origins, and bioisosteric substitutions across alkaloid and terpenoid clusters.')")
    },
    async ({ cluster_snapshot_id, prompt }) => {
      try {
        const report = await client.createClusterReport({ cluster_snapshot_id, prompt });
        return {
          content: [{ type: "text", text: JSON.stringify(report, null, 2) }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to create cluster report: ${err.message || String(err)}` }]
        };
      }
    }
  );

  server.tool(
    "delete_cluster_report",
    "Delete a synthesis report along with its intermediate summaries and sub-reports.",
    {
      id: z.number().int().positive().describe("Cluster Report ID to delete")
    },
    async ({ id }) => {
      try {
        const res = await client.deleteClusterReport(id);
        return {
          content: [{ type: "text", text: JSON.stringify(res, null, 2) }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to delete cluster report ${id}: ${err.message || String(err)}` }]
        };
      }
    }
  );

  server.tool(
    "generate_deep_synthesis",
    "Initiate a 3-Phase Hierarchical Deep Synthesis monograph, reusing Phase 1 summaries from a completed parent report.",
    {
      report_id: z.number().int().positive().describe("Parent Cluster Report ID"),
      batch_size: z
        .number()
        .int()
        .min(2)
        .max(20)
        .optional()
        .default(5)
        .describe("Batch size of archetype clusters to synthesize in Phase 2 (default: 5)")
    },
    async ({ report_id, batch_size }) => {
      try {
        const report = await client.deepSynthesis(report_id, { batch_size });
        return {
          content: [{ type: "text", text: JSON.stringify(report, null, 2) }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to generate deep synthesis for report ${report_id}: ${err.message || String(err)}` }]
        };
      }
    }
  );

  server.tool(
    "list_report_summaries",
    "List all Phase 1 per-cluster analyses belonging to a synthesis report.",
    {
      cluster_report_id: z.number().int().positive().describe("Cluster Report ID")
    },
    async ({ cluster_report_id }) => {
      try {
        const summaries = await client.listClusterReportSummaries(cluster_report_id);
        return {
          content: [{ type: "text", text: JSON.stringify(summaries, null, 2) }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to list summaries for report ${cluster_report_id}: ${err.message || String(err)}`
            }
          ]
        };
      }
    }
  );

  server.tool(
    "get_report_summary",
    "Retrieve a single Phase 1 per-cluster scholarly summary.",
    {
      id: z.number().int().positive().describe("Cluster Report Summary ID")
    },
    async ({ id }) => {
      try {
        const summary = await client.getClusterReportSummary(id);
        return {
          content: [{ type: "text", text: JSON.stringify(summary, null, 2) }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to get report summary ${id}: ${err.message || String(err)}` }]
        };
      }
    }
  );

  server.tool(
    "list_report_sub_reports",
    "List all Phase 2 intermediate batch analyses belonging to a detailed synthesis report.",
    {
      cluster_report_id: z.number().int().positive().describe("Cluster Report ID")
    },
    async ({ cluster_report_id }) => {
      try {
        const subReports = await client.listClusterSubReports(cluster_report_id);
        return {
          content: [{ type: "text", text: JSON.stringify(subReports, null, 2) }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to list sub-reports for report ${cluster_report_id}: ${err.message || String(err)}`
            }
          ]
        };
      }
    }
  );

  server.tool(
    "get_report_sub_report",
    "Retrieve a single Phase 2 batch analysis.",
    {
      id: z.number().int().positive().describe("Cluster Sub-Report ID")
    },
    async ({ id }) => {
      try {
        const subReport = await client.getClusterSubReport(id);
        return {
          content: [{ type: "text", text: JSON.stringify(subReport, null, 2) }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to get sub-report ${id}: ${err.message || String(err)}` }]
        };
      }
    }
  );
}
