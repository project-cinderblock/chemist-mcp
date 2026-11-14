import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ChemistApiClient } from "../client/index.js";

export function registerClusterTools(server: McpServer, client: ChemistApiClient): void {
  server.tool(
    "compute_clusters",
    "Compute live connected-components vector clusters for Molecules or FunctionalGroups across chemical classes without modifying the database.",
    {
      target_type: z
        .enum(["Molecule", "FunctionalGroup"])
        .optional()
        .default("Molecule")
        .describe("Target entity class to cluster: Molecule or FunctionalGroup"),
      level: z
        .number()
        .int()
        .min(1)
        .max(15)
        .optional()
        .default(5)
        .describe("Similarity granularity level from 1 (tight structural twins, <= 0.16 cosine dist) to 15 (full catalog coverage absorption, <= 0.30)"),
      full_coverage: z
        .boolean()
        .optional()
        .default(false)
        .describe("Forces 100% catalog assignment / zero singletons via nearest-cluster absorption"),
      force: z
        .boolean()
        .optional()
        .default(false)
        .describe("Bypass Rails memory cache and recalculate adjacency graph")
    },
    async ({ target_type, level, full_coverage, force }) => {
      try {
        const result = await client.computeClusters({ target_type, level, full_coverage, force });
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to compute clusters: ${err.message || String(err)}` }]
        };
      }
    }
  );

  server.tool(
    "create_cluster_snapshot",
    "Compute connected-components clustering and freeze it immediately into an immutable database snapshot.",
    {
      target_type: z.enum(["Molecule", "FunctionalGroup"]).describe("Target entity class: Molecule or FunctionalGroup"),
      level: z.number().int().min(1).max(15).describe("Similarity granularity level (1 to 15)"),
      full_coverage: z
        .boolean()
        .optional()
        .default(false)
        .describe("Force 100% catalog coverage (zero singletons)"),
      title: z
        .string()
        .min(1)
        .describe("Descriptive title for the frozen snapshot (e.g. 'Full Catalog Zero-Singleton Alkaloid Manifold (15)')")
    },
    async ({ target_type, level, full_coverage, title }) => {
      try {
        const snapshot = await client.createClusterSnapshot({ target_type, level, full_coverage, title });
        return {
          content: [{ type: "text", text: JSON.stringify(snapshot, null, 2) }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to create cluster snapshot: ${err.message || String(err)}` }]
        };
      }
    }
  );

  server.tool(
    "list_cluster_snapshots",
    "List frozen archetype cluster snapshots in Chemist.",
    {
      target_type: z
        .enum(["Molecule", "FunctionalGroup"])
        .optional()
        .describe("Filter by target entity type: Molecule or FunctionalGroup"),
      include_groups: z
        .boolean()
        .optional()
        .default(false)
        .describe("Include cluster groups for each snapshot"),
      limit: z.number().int().min(1).max(100).optional().default(20).describe("Pagination limit"),
      offset: z.number().int().min(0).optional().default(0).describe("Pagination offset")
    },
    async ({ target_type, include_groups, limit, offset }) => {
      try {
        const result = await client.listClusterSnapshots({ target_type, include_groups, limit, offset });
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to list cluster snapshots: ${err.message || String(err)}` }]
        };
      }
    }
  );

  server.tool(
    "get_cluster_snapshot",
    "Retrieve details of a frozen cluster snapshot including member groups and generated synthesis reports.",
    {
      id: z.number().int().positive().describe("Cluster Snapshot ID"),
      include_groups: z.boolean().optional().default(true).describe("Include discovered archetype cluster groups"),
      include_members: z
        .boolean()
        .optional()
        .default(true)
        .describe("Include molecules or functional groups belonging to each group"),
      include_reports: z.boolean().optional().default(true).describe("Include generated scholarly reports")
    },
    async ({ id, include_groups, include_members, include_reports }) => {
      try {
        const snapshot = await client.getClusterSnapshot(id, { include_groups, include_members, include_reports });
        return {
          content: [{ type: "text", text: JSON.stringify(snapshot, null, 2) }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to get cluster snapshot ${id}: ${err.message || String(err)}` }]
        };
      }
    }
  );

  server.tool(
    "delete_cluster_snapshot",
    "Delete a frozen cluster snapshot along with its cascaded cluster groups and synthesis reports.",
    {
      id: z.number().int().positive().describe("Cluster Snapshot ID to delete")
    },
    async ({ id }) => {
      try {
        const res = await client.deleteClusterSnapshot(id);
        return {
          content: [{ type: "text", text: JSON.stringify(res, null, 2) }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to delete cluster snapshot ${id}: ${err.message || String(err)}` }]
        };
      }
    }
  );

  server.tool(
    "list_cluster_groups",
    "List all archetype cluster groups belonging to a specific frozen snapshot.",
    {
      cluster_snapshot_id: z.number().int().positive().describe("Cluster Snapshot ID"),
      include_members: z.boolean().optional().default(true).describe("Include member molecules or functional groups")
    },
    async ({ cluster_snapshot_id, include_members }) => {
      try {
        const result = await client.listClusterGroups(cluster_snapshot_id, { include_members });
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to list cluster groups for snapshot ${cluster_snapshot_id}: ${err.message || String(err)}`
            }
          ]
        };
      }
    }
  );

  server.tool(
    "get_cluster_group",
    "Retrieve details of a specific archetype cluster group with all member molecules or functional groups.",
    {
      id: z.number().int().positive().describe("Cluster Group ID"),
      include_members: z.boolean().optional().default(true).describe("Include member molecules or functional groups")
    },
    async ({ id, include_members }) => {
      try {
        const group = await client.getClusterGroup(id, { include_members });
        return {
          content: [{ type: "text", text: JSON.stringify(group, null, 2) }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to get cluster group ${id}: ${err.message || String(err)}` }]
        };
      }
    }
  );
}
