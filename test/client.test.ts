import { describe, it, expect, beforeEach, afterEach } from "vitest";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { ChemistApiClient, ChemistApiError } from "../src/client/index.js";

describe("ChemistApiClient", () => {
  let mock: MockAdapter;
  let client: ChemistApiClient;

  beforeEach(() => {
    mock = new MockAdapter(axios);
    client = new ChemistApiClient({
      apiUrl: "http://localhost:3000/api/v1",
      timeoutMs: 5000
    });
  });

  afterEach(() => {
    mock.restore();
  });

  it("fetches platform status successfully", async () => {
    const mockStatus = {
      status: "ok",
      environment: "test",
      timestamp: "2026-11-14T00:00:00Z",
      counts: {
        chemical_classes: 6,
        molecules: 150,
        molecules_embedded: 150,
        functional_groups: 600,
        functional_groups_embedded: 600,
        cluster_snapshots: 5,
        cluster_reports: 3
      },
      config: {
        embedding_model: "qwen3-embedding:0.6b",
        embedding_api_base: "http://localhost:11434/v1",
        embedding_dimensions: 1024,
        llm_model: "Qwen3.6-35B-A3B-NVFP4",
        llm_api_base: "http://localhost:11434/v1",
        context_window: 262144,
        digest_char_budget: 576716
      }
    };

    mock.onGet("http://localhost:3000/api/v1/status").reply(200, { data: mockStatus });

    const status = await client.getStatus();
    expect(status.status).toBe("ok");
    expect(status.counts.chemical_classes).toBe(6);
    expect(status.counts.molecules).toBe(150);
    expect(status.counts.functional_groups).toBe(600);
  });

  it("handles 404 not found errors cleanly", async () => {
    mock.onGet("http://localhost:3000/api/v1/molecules/999").reply(404, {
      error: { code: "not_found", message: "Couldn't find Molecule with 'id'=999" }
    });

    await expect(client.getMolecule(999)).rejects.toThrowError(ChemistApiError);
    try {
      await client.getMolecule(999);
    } catch (err: any) {
      expect(err.code).toBe("not_found");
      expect(err.status).toBe(404);
      expect(err.message).toContain("Couldn't find Molecule");
    }
  });

  it("performs unified semantic search", async () => {
    const mockResults = [
      { type: "Molecule", score: 0.94, data: { id: 1, name: "Morphine" } }
    ];

    mock
      .onGet("http://localhost:3000/api/v1/search", {
        params: { q: "alkaloid opioid receptor agonist", mode: "semantic", limit: 5 }
      })
      .reply(200, { data: mockResults, meta: { mode: "semantic", count: 1 } });

    const res = await client.search({ q: "alkaloid opioid receptor agonist", mode: "semantic", limit: 5 });
    expect(res.data).toEqual(mockResults);
  });

  it("finds molecule and functional group counterparts via neighbors endpoints", async () => {
    const mockMolecules = [{ id: 2, name: "Codeine", neighbor_distance: 0.08 }];
    mock
      .onGet("http://localhost:3000/api/v1/molecules/1/neighbors", {
        params: { limit: 5 }
      })
      .reply(200, { data: mockMolecules });

    const moleculeNeighbors = await client.getMoleculeNeighbors(1, { limit: 5 });
    expect(moleculeNeighbors).toHaveLength(1);
    expect(moleculeNeighbors[0].name).toBe("Codeine");

    const mockFunctionalGroups = [{ id: 10, name: "Methoxy Group", neighbor_distance: 0.06 }];
    mock
      .onGet("http://localhost:3000/api/v1/functional_groups/4/neighbors", {
        params: { limit: 5, chemical_class_id: 1 }
      })
      .reply(200, { data: mockFunctionalGroups });

    const functionalGroupNeighbors = await client.getFunctionalGroupNeighbors(4, { limit: 5, chemical_class_id: 1 });
    expect(functionalGroupNeighbors).toHaveLength(1);
    expect(functionalGroupNeighbors[0].name).toBe("Methoxy Group");
  });

  it("executes chemical class CRUD methods", async () => {
    const mockClass = { id: 1, name: "Alkaloids", description: "Nitrogenous organic bases", molecules_count: 24 };

    mock.onPost("http://localhost:3000/api/v1/chemical_classes").reply(201, { data: mockClass });
    const created = await client.createChemicalClass({ name: "Alkaloids", description: "Nitrogenous organic bases" });
    expect(created.name).toBe("Alkaloids");

    mock.onPatch("http://localhost:3000/api/v1/chemical_classes/1").reply(200, { data: { ...mockClass, name: "Plant Alkaloids" } });
    const updated = await client.updateChemicalClass(1, { name: "Plant Alkaloids" });
    expect(updated.name).toBe("Plant Alkaloids");

    mock.onDelete("http://localhost:3000/api/v1/chemical_classes/1").reply(200, { data: { id: 1, name: "Plant Alkaloids", deleted: true } });
    const deleted = await client.deleteChemicalClass(1);
    expect(deleted.deleted).toBe(true);
  });

  it("executes clustering, snapshots, and reports", async () => {
    const mockSnapshot = {
      id: 1,
      target_type: "Molecule",
      level: 5,
      distance_threshold: 0.20,
      title: "Alkaloid Structural Clusters",
      clusters_count: 8,
      items_count: 45
    };

    mock.onPost("http://localhost:3000/api/v1/clusters/snapshot").reply(201, { data: mockSnapshot });
    const snapshot = await client.createClusterSnapshot({
      target_type: "Molecule",
      level: 5,
      title: "Alkaloid Structural Clusters"
    });
    expect(snapshot.id).toBe(1);
    expect(snapshot.clusters_count).toBe(8);

    const mockReport = {
      id: 10,
      cluster_snapshot_id: 1,
      title: "Comparative Study of Isoquinoline Motifs",
      prompt: "Synthesize motifs",
      status: "completed",
      phase: "completed",
      progress_percentage: 100,
      is_detailed: false
    };

    mock.onPost("http://localhost:3000/api/v1/cluster_reports").reply(201, { data: mockReport });
    const report = await client.createClusterReport({
      cluster_snapshot_id: 1,
      prompt: "Synthesize motifs"
    });
    expect(report.id).toBe(10);
    expect(report.status).toBe("completed");
  });
});
