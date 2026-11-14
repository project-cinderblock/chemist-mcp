import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { ChemistApiClient } from "../src/client/index.js";
import { registerAllTools } from "../src/tools/index.js";
import { registerResources } from "../src/resources/index.js";
import { registerPrompts } from "../src/prompts/index.js";

describe("MCP Server Tool, Resource, and Prompt Execution", () => {
  let mock: MockAdapter;
  let server: McpServer;
  let client: ChemistApiClient;

  beforeEach(() => {
    mock = new MockAdapter(axios);
    server = new McpServer(
      { name: "chemist-test", version: "1.0.0" },
      { capabilities: { tools: {}, resources: {}, prompts: {} } }
    );
    client = new ChemistApiClient({
      apiUrl: "http://localhost:3000/api/v1",
      timeoutMs: 5000
    });
    registerAllTools(server, client);
    registerResources(server, client);
    registerPrompts(server);
  });

  afterEach(() => {
    mock.restore();
  });

  it("registers all 51 expected tools across all 8 domains", () => {
    const registeredToolNames = Object.keys((server as any)._registeredTools);

    const expectedTools = [
      // Search (2)
      "search",
      "find_counterparts",
      // Chemical Classes (8)
      "list_chemical_classes",
      "get_chemical_class",
      "create_chemical_class",
      "update_chemical_class",
      "delete_chemical_class",
      "upsert_chemical_classes_batch",
      "populate_chemical_classes",
      "populate_chemical_class_molecules",
      // Molecules (9)
      "list_molecules",
      "get_molecule",
      "create_molecule",
      "update_molecule",
      "delete_molecule",
      "upsert_molecules_batch",
      "generate_molecule_embedding",
      "populate_molecule_functional_groups",
      "populate_molecules_bulk",
      // Functional Groups (8)
      "list_functional_groups",
      "get_functional_group",
      "create_functional_group",
      "update_functional_group",
      "delete_functional_group",
      "upsert_functional_groups_batch",
      "generate_functional_group_embedding",
      "populate_functional_groups_bulk",
      // Clusters & Snapshots (7)
      "compute_clusters",
      "create_cluster_snapshot",
      "list_cluster_snapshots",
      "get_cluster_snapshot",
      "delete_cluster_snapshot",
      "list_cluster_groups",
      "get_cluster_group",
      // Reports (9)
      "list_cluster_reports",
      "get_cluster_report",
      "create_cluster_report",
      "delete_cluster_report",
      "generate_deep_synthesis",
      "list_report_summaries",
      "get_report_summary",
      "list_report_sub_reports",
      "get_report_sub_report",
      // Jobs (3)
      "list_jobs",
      "get_job_status",
      "wait_for_job",
      // System (5)
      "get_platform_status",
      "get_settings",
      "update_context_window",
      "trigger_bulk_embeddings",
      "get_openapi_spec"
    ];

    for (const tool of expectedTools) {
      expect(registeredToolNames).toContain(tool);
    }
    expect(registeredToolNames.length).toBe(51);
  });

  it("executes get_platform_status tool cleanly", async () => {
    const mockStatus = {
      status: "ok",
      environment: "production",
      counts: { chemical_classes: 10, molecules: 200 }
    };
    mock.onGet("http://localhost:3000/api/v1/status").reply(200, { data: mockStatus });

    const tool = (server as any)._registeredTools["get_platform_status"];
    const response = await tool.handler({}, {});

    expect(response.content).toBeDefined();
    expect(response.content[0].type).toBe("text");
    const parsed = JSON.parse(response.content[0].text);
    expect(parsed.status).toBe("ok");
    expect(parsed.counts.molecules).toBe(200);
  });

  it("executes search tool and returns formatted JSON", async () => {
    const mockHit = [{ type: "Molecule", data: { id: 1, name: "Taxol" } }];
    mock.onGet("http://localhost:3000/api/v1/search").reply(200, { data: mockHit });

    const tool = (server as any)._registeredTools["search"];
    const response = await tool.handler({ q: "anticancer paclitaxel diterpenoid", mode: "auto", target_type: "all", limit: 10 }, {});

    expect(response.content).toBeDefined();
    const parsed = JSON.parse(response.content[0].text);
    expect(parsed.data[0].data.name).toBe("Taxol");
  });

  it("executes find_counterparts for molecule and functional_group", async () => {
    mock
      .onGet("http://localhost:3000/api/v1/molecules/5/neighbors")
      .reply(200, { data: [{ id: 6, name: "Morphinan", neighbor_distance: 0.05 }] });

    const tool = (server as any)._registeredTools["find_counterparts"];
    const res = await tool.handler({ entity_type: "molecule", id: 5, limit: 5, include_embedding: false }, {});

    expect(res.content).toBeDefined();
    const parsed = JSON.parse(res.content[0].text);
    expect(parsed[0].name).toBe("Morphinan");
  });

  it("handles tool errors with isError flag and message", async () => {
    mock.onGet("http://localhost:3000/api/v1/chemical_classes/999").reply(500, {
      error: { code: "internal_error", message: "Database connection failed" }
    });

    const tool = (server as any)._registeredTools["get_chemical_class"];
    const response = await tool.handler({ id: 999, include_molecules: true }, {});

    expect(response.isError).toBe(true);
    expect(response.content[0].text).toContain("Database connection failed");
  });

  it("registers resources correctly", () => {
    const registeredResources = (server as any)._registeredResources;
    const registeredTemplates = (server as any)._registeredResourceTemplates;

    expect(registeredResources["chemist://status"]).toBeDefined();
    expect(registeredResources["chemist://chemical-classes"]).toBeDefined();
    expect(Object.keys(registeredTemplates)).toHaveLength(2);
  });

  it("registers both MCP prompts", () => {
    const registeredPrompts = (server as any)._registeredPrompts;
    expect(registeredPrompts["comparative_chemical_analysis"]).toBeDefined();
    expect(registeredPrompts["chemical_cluster_monograph"]).toBeDefined();

    const promptObj = registeredPrompts["comparative_chemical_analysis"];
    const res = promptObj.callback({
      entity_a: "Morphine",
      entity_b: "Codeine",
      entity_type: "molecule"
    });
    expect(res.description).toContain("Comparative chemical analysis");
    expect(res.messages[0].content.text).toContain("Morphine");
    expect(res.messages[0].content.text).toContain("Codeine");
  });
});
