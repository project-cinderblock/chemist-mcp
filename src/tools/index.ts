import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ChemistApiClient } from "../client/index.js";
import { registerSearchTools } from "./search.js";
import { registerChemicalClassTools } from "./chemical_classes.js";
import { registerMoleculeTools } from "./molecules.js";
import { registerFunctionalGroupTools } from "./functional_groups.js";
import { registerClusterTools } from "./clusters.js";
import { registerReportTools } from "./reports.js";
import { registerJobTools } from "./jobs.js";
import { registerSystemTools } from "./system.js";

export function registerAllTools(server: McpServer, client: ChemistApiClient): void {
  registerSearchTools(server, client);
  registerChemicalClassTools(server, client);
  registerMoleculeTools(server, client);
  registerFunctionalGroupTools(server, client);
  registerClusterTools(server, client);
  registerReportTools(server, client);
  registerJobTools(server, client);
  registerSystemTools(server, client);
}
