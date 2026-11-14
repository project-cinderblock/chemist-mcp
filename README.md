# Chemist Model Context Protocol (MCP) Server

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-1.32.2-purple.svg)](https://modelcontextprotocol.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A Model Context Protocol (MCP) server providing deep LLM-agent tool, resource, and prompt integrations with **[Chemist](https://github.com/leouofa/chemist)** — an open-source computational research platform and quantitative analytical laboratory for comparative chemistry, molecular structures, and functional group manifolds.

---

## Overview

The `chemist-mcp` server enables AI agents (Claude Code, Cursor, Gemini CLI, Antigravity) to query, manipulate, cluster, and synthesize chemistry domain models directly over standard input/output (`stdio`):

- **51 Registered MCP Tools** across 8 functional modules (Search, Chemical Classes, Molecules, Functional Groups, Clustering, Synthesis Reports, Background Jobs, and System Diagnostics).
- **4 Registered MCP Resources** exposing read-only live platform status, catalogs, cluster snapshots, and markdown monographs.
- **2 MCP Prompt Templates** for comparative chemistry studies and cluster synthesis monographs.
- **1024-dimensional semantic manifold** querying via PostgreSQL `pgvector` HNSW indexes.

---

## Architectural Mapping

| Tier / Domain | Model | Table Name | MCP Module / Tools |
|---|---|---|---|
| **Tier 1** | Chemical Superfamilies | `chemical_classes` | `list_chemical_classes`, `get_chemical_class`, `create_chemical_class`, `update_chemical_class`, `delete_chemical_class`, `upsert_chemical_classes_batch`, `populate_chemical_classes`, `populate_chemical_class_molecules` |
| **Tier 2** | Molecules / Compounds | `molecules` | `list_molecules`, `get_molecule`, `create_molecule`, `update_molecule`, `delete_molecule`, `upsert_molecules_batch`, `generate_molecule_embedding`, `populate_molecule_functional_groups`, `populate_molecules_bulk` |
| **Tier 3** | Functional Groups / Reactive Motifs | `functional_groups` | `list_functional_groups`, `get_functional_group`, `create_functional_group`, `update_functional_group`, `delete_functional_group`, `upsert_functional_groups_batch`, `generate_functional_group_embedding`, `populate_functional_groups_bulk` |
| **Clustering** | 15-Level Agglomerative | `cluster_snapshots`, `cluster_groups` | `compute_clusters`, `create_cluster_snapshot`, `list_cluster_snapshots`, `get_cluster_snapshot`, `delete_cluster_snapshot`, `list_cluster_groups`, `get_cluster_group` |
| **Synthesis** | Multi-Stage Map-Reduce | `cluster_reports`, `cluster_report_summaries` | `list_cluster_reports`, `get_cluster_report`, `create_cluster_report`, `delete_cluster_report`, `generate_deep_synthesis`, `list_report_summaries`, `get_report_summary`, `list_report_sub_reports`, `get_report_sub_report` |
| **Global Search** | Cross-Catalog pgvector | Multi-table | `search`, `find_counterparts` |
| **Platform** | Jobs & System Info | Multi-service | `list_jobs`, `get_job_status`, `wait_for_job`, `get_platform_status`, `get_settings`, `update_context_window`, `trigger_bulk_embeddings`, `get_openapi_spec` |

---

## Installation & Setup

### Prerequisites
- Node.js 20+
- Running instance of [Chemist](https://github.com/leouofa/chemist) (`http://localhost:3000`)

### Build
```bash
git clone https://github.com/leouofa/chemist-mcp.git
cd chemist-mcp
npm install
npm run build
```

---

## Configuration

### Environment Variables
Configure via `.env` file or export in your shell:

```bash
# Base URL for the Chemist Rails API (v1)
CHEMIST_API_URL=http://localhost:3000/api/v1

# Optional API key if authentication is enabled
# CHEMIST_API_KEY=

# HTTP request timeout in milliseconds (default: 60000)
CHEMIST_TIMEOUT_MS=60000
```

### CLI Arguments
```bash
chemist-mcp [options]

Options:
  -u, --url <url>        Chemist API base URL (default: http://localhost:3000/api/v1)
  -k, --api-key <key>    Optional API key / Bearer token
  -t, --timeout <ms>     Request timeout in milliseconds (default: 60000)
  -h, --help             Display help message
```

---

## MCP Client Configuration

### Claude Desktop / Antigravity / Cursor Configuration
Add to your client configuration (e.g. `claude_desktop_config.json` or MCP settings):

```json
{
  "mcpServers": {
    "chemist": {
      "command": "node",
      "args": ["/path/to/chemist-mcp/dist/index.js"],
      "env": {
        "CHEMIST_API_URL": "http://localhost:3000/api/v1"
      }
    }
  }
}
```

---

## MCP Tools Reference (51 Tools)

### Search (2 tools)
- `search`: Cross-catalog hybrid semantic (1024-d cosine similarity) and keyword search across molecules and functional groups.
- `find_counterparts`: Find nearest bioisosteric analogs or reactive motifs using vector cosine distance.

### Chemical Classes (8 tools)
- `list_chemical_classes`: Query superfamilies with molecule counts and filters.
- `get_chemical_class`: Detailed chemical class view with associated molecules.
- `create_chemical_class`: Register a new chemical superfamily.
- `update_chemical_class`: Update name or description.
- `delete_chemical_class`: Remove chemical class and cascaded children.
- `upsert_chemical_classes_batch`: Bulk insert/update chemical classes.
- `populate_chemical_classes`: Trigger LLM discovery agent for superfamilies.
- `populate_chemical_class_molecules`: Discover molecules for a specific chemical class.

### Molecules (9 tools)
- `list_molecules`: List molecules with filter by chemical class, themes, and embedding status.
- `get_molecule`: Detailed molecule view with child functional groups and embeddings.
- `create_molecule`: Register a new compound.
- `update_molecule`: Update name, description, themes, or parent chemical class.
- `delete_molecule`: Delete molecule and child functional groups.
- `upsert_molecules_batch`: Bulk upsert molecules under a chemical class.
- `generate_molecule_embedding`: Generate or refresh 1024-d vector embedding.
- `populate_molecule_functional_groups`: Discover reactive motifs for a molecule.
- `populate_molecules_bulk`: Bulk discover molecules across chemical classes.

### Functional Groups (8 tools)
- `list_functional_groups`: List reactive motifs with thematic filtering.
- `get_functional_group`: Detailed functional group view.
- `create_functional_group`: Register a new functional group under a molecule.
- `update_functional_group`: Update name, description, or themes.
- `delete_functional_group`: Remove functional group record.
- `upsert_functional_groups_batch`: Bulk upsert functional groups for a molecule.
- `generate_functional_group_embedding`: Generate or refresh 1024-d vector embedding.
- `populate_functional_groups_bulk`: Bulk discover functional groups.

### Clusters & Snapshots (7 tools)
- `compute_clusters`: Preview live connected-components clusters across 15 levels.
- `create_cluster_snapshot`: Freeze cluster configuration into database snapshot.
- `list_cluster_snapshots`: List frozen snapshots.
- `get_cluster_snapshot`: Retrieve snapshot with groups and member entities.
- `delete_cluster_snapshot`: Delete cluster snapshot.
- `list_cluster_groups`: List archetype groups for a snapshot.
- `get_cluster_group`: Detailed cluster group inspection.

### Synthesis Reports (9 tools)
- `list_cluster_reports`: List multi-phase synthesis monographs.
- `get_cluster_report`: Retrieve full markdown monograph and progress state.
- `create_cluster_report`: Initiate 2-Phase Map-Reduce synthesis.
- `delete_cluster_report`: Remove report and associated summaries.
- `generate_deep_synthesis`: Initiate 3-Phase Hierarchical Deep Synthesis monograph.
- `list_report_summaries`: List Phase 1 per-cluster analyses.
- `get_report_summary`: Retrieve single cluster analysis.
- `list_report_sub_reports`: List Phase 2 batch syntheses.
- `get_report_sub_report`: Retrieve single batch synthesis.

### Background Jobs (3 tools)
- `list_jobs`: List recent background Sidekiq/ActiveJob tasks.
- `get_job_status`: Poll job status and progress metadata.
- `wait_for_job`: Wait synchronously for job completion with timeout.

### Platform & Settings (5 tools)
- `get_platform_status`: Health check, entity counts, active model parameters.
- `get_settings`: Vector embedding metrics and LLM context window presets.
- `update_context_window`: Update context token budget.
- `trigger_bulk_embeddings`: Enqueue bulk embedding calculation.
- `get_openapi_spec`: Retrieve complete raw OpenAPI specification.

---

## MCP Resources Reference (4 Resources)

- `chemist://status`: Real-time JSON health check, model configuration, and database item counters.
- `chemist://chemical-classes`: JSON catalog of top registered chemical classes.
- `chemist://snapshots/{id}`: Detailed JSON payload for a frozen cluster snapshot with member groups.
- `chemist://reports/{id}`: Formatted Markdown synthesis monograph.

---

## MCP Prompts Reference (2 Prompts)

- `comparative_chemical_analysis`: Structured workflow comparing two molecules or functional groups through stereoelectronic, biosynthetic, and vector cosine distance lenses.
- `chemical_cluster_monograph`: Guided investigation of an agglomerative cluster snapshot producing an executive monograph with citations to specific cluster groups.

---

## License

MIT License. Copyright (c) 2026 Leonid Medovyy.
