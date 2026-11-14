import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ChemistApiClient } from "../client/index.js";

export function registerResources(server: McpServer, client: ChemistApiClient): void {
  // Platform Status Resource
  server.resource(
    "platform-status",
    "chemist://status",
    async (uri) => {
      try {
        const status = await client.getStatus();
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "application/json",
              text: JSON.stringify(status, null, 2)
            }
          ]
        };
      } catch (err: any) {
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "text/plain",
              text: `Error loading status: ${err.message || String(err)}`
            }
          ]
        };
      }
    }
  );

  // Chemical Classes Catalog Resource
  server.resource(
    "chemical-classes-catalog",
    "chemist://chemical-classes",
    async (uri) => {
      try {
        const chemicalClasses = await client.listChemicalClasses({ limit: 100 });
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "application/json",
              text: JSON.stringify(chemicalClasses, null, 2)
            }
          ]
        };
      } catch (err: any) {
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "text/plain",
              text: `Error loading chemical classes: ${err.message || String(err)}`
            }
          ]
        };
      }
    }
  );

  // Cluster Snapshot Resource
  server.resource(
    "cluster-snapshot",
    new ResourceTemplate("chemist://snapshots/{id}", { list: undefined }),
    async (uri, { id }) => {
      try {
        const snapshotId = parseInt(id as string, 10);
        const snapshot = await client.getClusterSnapshot(snapshotId, {
          include_groups: true,
          include_members: true,
          include_reports: true
        });
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "application/json",
              text: JSON.stringify(snapshot, null, 2)
            }
          ]
        };
      } catch (err: any) {
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "text/plain",
              text: `Error loading snapshot ${id}: ${err.message || String(err)}`
            }
          ]
        };
      }
    }
  );

  // Cluster Report Resource (Markdown Monograph)
  server.resource(
    "cluster-report",
    new ResourceTemplate("chemist://reports/{id}", { list: undefined }),
    async (uri, { id }) => {
      try {
        const reportId = parseInt(id as string, 10);
        const report = await client.getClusterReport(reportId, {
          include_summaries: true,
          include_sub_reports: true
        });
        const markdown =
          report.content ||
          `# ${report.title}\n\n*Status*: ${report.status} (Phase: ${report.phase || "N/A"})\n\nNo monograph markdown generated yet.`;
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "text/markdown",
              text: markdown
            }
          ]
        };
      } catch (err: any) {
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "text/plain",
              text: `Error loading report ${id}: ${err.message || String(err)}`
            }
          ]
        };
      }
    }
  );
}
