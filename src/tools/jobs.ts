import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ChemistApiClient } from "../client/index.js";

export function registerJobTools(server: McpServer, client: ChemistApiClient): void {
  server.tool(
    "list_jobs",
    "List recent asynchronous background jobs (embedding calculations, LLM discoveries, synthesis reports).",
    {
      limit: z.number().int().min(1).max(50).optional().default(20).describe("Maximum number of recent jobs to return")
    },
    async ({ limit }) => {
      try {
        const jobs = await client.listJobs(limit);
        return {
          content: [{ type: "text", text: JSON.stringify(jobs, null, 2) }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to list jobs: ${err.message || String(err)}` }]
        };
      }
    }
  );

  server.tool(
    "get_job_status",
    "Check the status, progress, and result of an ActiveJob/Sidekiq background task.",
    {
      job_id: z.string().describe("ActiveJob UUID")
    },
    async ({ job_id }) => {
      try {
        const job = await client.getJob(job_id);
        return {
          content: [{ type: "text", text: JSON.stringify(job, null, 2) }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to get status for job ${job_id}: ${err.message || String(err)}` }]
        };
      }
    }
  );

  server.tool(
    "wait_for_job",
    "Poll a background job until completion or failure with configurable timeout.",
    {
      job_id: z.string().describe("ActiveJob UUID to wait for"),
      poll_interval_ms: z
        .number()
        .int()
        .min(500)
        .max(10000)
        .optional()
        .default(2000)
        .describe("Polling interval in milliseconds (default: 2000)"),
      timeout_ms: z
        .number()
        .int()
        .min(1000)
        .max(600000)
        .optional()
        .default(60000)
        .describe("Maximum wait timeout in milliseconds (default: 60000)")
    },
    async ({ job_id, poll_interval_ms, timeout_ms }) => {
      try {
        const job = await client.waitForJob(job_id, poll_interval_ms, timeout_ms);
        return {
          content: [{ type: "text", text: JSON.stringify(job, null, 2) }]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Job waiting failed: ${err.message || String(err)}` }]
        };
      }
    }
  );
}
