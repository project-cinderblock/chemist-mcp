# Changelog

All notable changes to `chemist-mcp` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-11-14

### Added
- Initial release of `chemist-mcp` Model Context Protocol server.
- Full 51-tool suite mirroring the 3-tier comparative chemistry architecture:
  - Global Search (2 tools): `search`, `find_counterparts`
  - Chemical Classes / Superfamilies (8 tools): `list_chemical_classes`, `get_chemical_class`, `create_chemical_class`, `update_chemical_class`, `delete_chemical_class`, `upsert_chemical_classes_batch`, `populate_chemical_classes`, `populate_chemical_class_molecules`
  - Molecules / Compounds (9 tools): `list_molecules`, `get_molecule`, `create_molecule`, `update_molecule`, `delete_molecule`, `upsert_molecules_batch`, `generate_molecule_embedding`, `populate_molecule_functional_groups`, `populate_molecules_bulk`
  - Functional Groups / Reactive Motifs (8 tools): `list_functional_groups`, `get_functional_group`, `create_functional_group`, `update_functional_group`, `delete_functional_group`, `upsert_functional_groups_batch`, `generate_functional_group_embedding`, `populate_functional_groups_bulk`
  - Clusters & Snapshots (7 tools): `compute_clusters`, `create_cluster_snapshot`, `list_cluster_snapshots`, `get_cluster_snapshot`, `delete_cluster_snapshot`, `list_cluster_groups`, `get_cluster_group`
  - Synthesis Reports (9 tools): `list_cluster_reports`, `get_cluster_report`, `create_cluster_report`, `delete_cluster_report`, `generate_deep_synthesis`, `list_report_summaries`, `get_report_summary`, `list_report_sub_reports`, `get_report_sub_report`
  - ActiveJob / Background Tasks (3 tools): `list_jobs`, `get_job_status`, `wait_for_job`
  - System, Status & Configuration (5 tools): `get_platform_status`, `get_settings`, `update_context_window`, `trigger_bulk_embeddings`, `get_openapi_spec`
- 4 MCP Resources: `chemist://status`, `chemist://chemical-classes`, `chemist://snapshots/{id}`, `chemist://reports/{id}`
- 2 MCP Prompts: `comparative_chemical_analysis`, `chemical_cluster_monograph`
- Typed HTTP Client (`ChemistApiClient`) with error mapping (`ChemistApiError`) and polling support.
- Complete Vitest test suite.
