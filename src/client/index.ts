import axios, { AxiosInstance, AxiosError } from "axios";
import { ServerConfig } from "../config.js";
import {
  ApiResponse,
  PlatformStatus,
  PlatformSettings,
  ChemicalClass,
  Molecule,
  FunctionalGroup,
  LiveClusterResult,
  ClusterSnapshot,
  ClusterGroup,
  ClusterReport,
  ClusterReportSummary,
  ClusterSubReport,
  JobStatus
} from "./types.js";

export class ChemistApiError extends Error {
  public code: string;
  public status?: number;
  public details?: string[];

  constructor(message: string, code = "api_error", status?: number, details?: string[]) {
    super(message);
    this.name = "ChemistApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export class ChemistApiClient {
  private http: AxiosInstance;
  public readonly apiUrl: string;

  constructor(config: ServerConfig) {
    this.apiUrl = config.apiUrl;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json"
    };

    if (config.apiKey) {
      headers["Authorization"] = `Bearer ${config.apiKey}`;
    }

    this.http = axios.create({
      baseURL: config.apiUrl,
      timeout: config.timeoutMs,
      headers
    });
  }

  private handleError(error: unknown): never {
    if (axios.isAxiosError(error)) {
      const axiosErr = error as AxiosError<{ error?: { code?: string; message?: string; details?: string[] } }>;
      const status = axiosErr.response?.status;
      const errorPayload = axiosErr.response?.data?.error;

      if (errorPayload) {
        throw new ChemistApiError(
          errorPayload.message || axiosErr.message,
          errorPayload.code || "api_error",
          status,
          errorPayload.details
        );
      }

      throw new ChemistApiError(
        axiosErr.message,
        status ? `http_${status}` : "network_error",
        status
      );
    }

    if (error instanceof Error) {
      throw new ChemistApiError(error.message);
    }

    throw new ChemistApiError(String(error));
  }

  // System & Status
  async getStatus(): Promise<PlatformStatus> {
    try {
      const res = await this.http.get<ApiResponse<PlatformStatus>>("/status");
      return res.data.data;
    } catch (err) {
      return this.handleError(err);
    }
  }

  async getOpenApiSpec(): Promise<Record<string, unknown>> {
    try {
      const res = await this.http.get<Record<string, unknown>>("/openapi.json");
      return res.data;
    } catch (err) {
      return this.handleError(err);
    }
  }

  async getSettings(): Promise<PlatformSettings> {
    try {
      const res = await this.http.get<ApiResponse<PlatformSettings>>("/settings");
      return res.data.data;
    } catch (err) {
      return this.handleError(err);
    }
  }

  async updateContextWindow(contextWindow: number): Promise<unknown> {
    try {
      const res = await this.http.patch<ApiResponse<unknown>>("/settings/context_window", {
        context_window: contextWindow
      });
      return res.data.data;
    } catch (err) {
      return this.handleError(err);
    }
  }

  async generateBulkEmbeddings(modelType: "Molecule" | "FunctionalGroup", onlyMissing = true): Promise<unknown> {
    try {
      const res = await this.http.post<ApiResponse<unknown>>("/settings/generate_embeddings", {
        model_type: modelType,
        only_missing: onlyMissing
      });
      return res.data.data;
    } catch (err) {
      return this.handleError(err);
    }
  }

  // Global Search
  async search(params: {
    q: string;
    mode?: "semantic" | "keyword" | "auto";
    target_type?: "all" | "molecule" | "functional_group";
    limit?: number;
  }): Promise<ApiResponse<unknown>> {
    try {
      const res = await this.http.get<ApiResponse<unknown>>("/search", { params });
      return res.data;
    } catch (err) {
      return this.handleError(err);
    }
  }

  // Chemical Classes
  async listChemicalClasses(params?: {
    q?: string;
    include_molecules?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<ChemicalClass[]>> {
    try {
      const res = await this.http.get<ApiResponse<ChemicalClass[]>>("/chemical_classes", { params });
      return res.data;
    } catch (err) {
      return this.handleError(err);
    }
  }

  async getChemicalClass(id: number, params?: { include_molecules?: boolean }): Promise<ChemicalClass> {
    try {
      const res = await this.http.get<ApiResponse<ChemicalClass>>(`/chemical_classes/${id}`, { params });
      return res.data.data;
    } catch (err) {
      return this.handleError(err);
    }
  }

  async createChemicalClass(chemical_class: { name: string; description?: string }): Promise<ChemicalClass> {
    try {
      const res = await this.http.post<ApiResponse<ChemicalClass>>("/chemical_classes", { chemical_class });
      return res.data.data;
    } catch (err) {
      return this.handleError(err);
    }
  }

  async updateChemicalClass(id: number, chemical_class: { name?: string; description?: string }): Promise<ChemicalClass> {
    try {
      const res = await this.http.patch<ApiResponse<ChemicalClass>>(`/chemical_classes/${id}`, { chemical_class });
      return res.data.data;
    } catch (err) {
      return this.handleError(err);
    }
  }

  async deleteChemicalClass(id: number): Promise<{ id: number; name: string; deleted: boolean }> {
    try {
      const res = await this.http.delete<ApiResponse<{ id: number; name: string; deleted: boolean }>>(`/chemical_classes/${id}`);
      return res.data.data;
    } catch (err) {
      return this.handleError(err);
    }
  }

  async upsertChemicalClassesBatch(
    chemical_classes: Array<{ name: string; description?: string }>
  ): Promise<ApiResponse<ChemicalClass[]>> {
    try {
      const res = await this.http.post<ApiResponse<ChemicalClass[]>>("/chemical_classes/upsert_batch", {
        chemical_classes
      });
      return res.data;
    } catch (err) {
      return this.handleError(err);
    }
  }

  async populateChemicalClasses(sync = false): Promise<unknown> {
    try {
      const res = await this.http.post<ApiResponse<unknown>>(
        "/chemical_classes/populate",
        {},
        {
          params: { sync }
        }
      );
      return res.data.data;
    } catch (err) {
      return this.handleError(err);
    }
  }

  async populateChemicalClassMolecules(chemicalClassId: number, sync = true): Promise<unknown> {
    try {
      const res = await this.http.post<ApiResponse<unknown>>(
        `/chemical_classes/${chemicalClassId}/populate_molecules`,
        {},
        {
          params: { sync }
        }
      );
      return res.data.data;
    } catch (err) {
      return this.handleError(err);
    }
  }

  // Molecules
  async listMolecules(params?: {
    chemical_class_id?: number;
    chemical_class?: string;
    theme?: string;
    q?: string;
    embedded?: boolean;
    include_functional_groups?: boolean;
    include_embedding?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<Molecule[]>> {
    try {
      const res = await this.http.get<ApiResponse<Molecule[]>>("/molecules", { params });
      return res.data;
    } catch (err) {
      return this.handleError(err);
    }
  }

  async getMolecule(id: number, params?: { include_embedding?: boolean; include_functional_groups?: boolean }): Promise<Molecule> {
    try {
      const res = await this.http.get<ApiResponse<Molecule>>(`/molecules/${id}`, { params });
      return res.data.data;
    } catch (err) {
      return this.handleError(err);
    }
  }

  async createMolecule(molecule: {
    chemical_class_id: number;
    name: string;
    description?: string;
    themes?: string[];
  }): Promise<Molecule> {
    try {
      const res = await this.http.post<ApiResponse<Molecule>>("/molecules", { molecule });
      return res.data.data;
    } catch (err) {
      return this.handleError(err);
    }
  }

  async updateMolecule(
    id: number,
    molecule: {
      name?: string;
      description?: string;
      themes?: string[];
      chemical_class_id?: number;
    }
  ): Promise<Molecule> {
    try {
      const res = await this.http.patch<ApiResponse<Molecule>>(`/molecules/${id}`, { molecule });
      return res.data.data;
    } catch (err) {
      return this.handleError(err);
    }
  }

  async deleteMolecule(id: number): Promise<{ id: number; name: string; deleted: boolean }> {
    try {
      const res = await this.http.delete<ApiResponse<{ id: number; name: string; deleted: boolean }>>(`/molecules/${id}`);
      return res.data.data;
    } catch (err) {
      return this.handleError(err);
    }
  }

  async upsertMoleculesBatch(
    chemicalClassId: number,
    molecules: Array<{
      name: string;
      description?: string;
      themes?: string[];
    }>
  ): Promise<ApiResponse<Molecule[]>> {
    try {
      const res = await this.http.post<ApiResponse<Molecule[]>>("/molecules/upsert_batch", {
        chemical_class_id: chemicalClassId,
        molecules
      });
      return res.data;
    } catch (err) {
      return this.handleError(err);
    }
  }

  async getMoleculeNeighbors(
    id: number,
    params?: { limit?: number; chemical_class_id?: number; include_embedding?: boolean }
  ): Promise<Molecule[]> {
    try {
      const res = await this.http.get<ApiResponse<Molecule[]>>(`/molecules/${id}/neighbors`, { params });
      return res.data.data;
    } catch (err) {
      return this.handleError(err);
    }
  }

  async generateMoleculeEmbedding(id: number, sync = true): Promise<unknown> {
    try {
      const res = await this.http.post<ApiResponse<unknown>>(
        `/molecules/${id}/generate_embedding`,
        {},
        {
          params: { sync }
        }
      );
      return res.data.data;
    } catch (err) {
      return this.handleError(err);
    }
  }

  async populateMoleculeFunctionalGroups(id: number, sync = true): Promise<unknown> {
    try {
      const res = await this.http.post<ApiResponse<unknown>>(
        `/molecules/${id}/populate_functional_groups`,
        {},
        {
          params: { sync }
        }
      );
      return res.data.data;
    } catch (err) {
      return this.handleError(err);
    }
  }

  async populateMolecules(chemicalClassId?: number, sync = false): Promise<unknown> {
    try {
      const res = await this.http.post<ApiResponse<unknown>>(
        "/molecules/populate",
        {},
        {
          params: { chemical_class_id: chemicalClassId, sync }
        }
      );
      return res.data.data;
    } catch (err) {
      return this.handleError(err);
    }
  }

  // Functional Groups
  async listFunctionalGroups(params?: {
    molecule_id?: number;
    chemical_class_id?: number;
    theme?: string;
    q?: string;
    embedded?: boolean;
    include_embedding?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<FunctionalGroup[]>> {
    try {
      const res = await this.http.get<ApiResponse<FunctionalGroup[]>>("/functional_groups", { params });
      return res.data;
    } catch (err) {
      return this.handleError(err);
    }
  }

  async getFunctionalGroup(id: number, params?: { include_embedding?: boolean }): Promise<FunctionalGroup> {
    try {
      const res = await this.http.get<ApiResponse<FunctionalGroup>>(`/functional_groups/${id}`, { params });
      return res.data.data;
    } catch (err) {
      return this.handleError(err);
    }
  }

  async createFunctionalGroup(functional_group: {
    molecule_id: number;
    name: string;
    description?: string;
    themes?: string[];
  }): Promise<FunctionalGroup> {
    try {
      const res = await this.http.post<ApiResponse<FunctionalGroup>>("/functional_groups", { functional_group });
      return res.data.data;
    } catch (err) {
      return this.handleError(err);
    }
  }

  async updateFunctionalGroup(
    id: number,
    functional_group: {
      name?: string;
      description?: string;
      themes?: string[];
      molecule_id?: number;
    }
  ): Promise<FunctionalGroup> {
    try {
      const res = await this.http.patch<ApiResponse<FunctionalGroup>>(`/functional_groups/${id}`, { functional_group });
      return res.data.data;
    } catch (err) {
      return this.handleError(err);
    }
  }

  async deleteFunctionalGroup(id: number): Promise<{ id: number; molecule_id: number; deleted: boolean }> {
    try {
      const res = await this.http.delete<ApiResponse<{ id: number; molecule_id: number; deleted: boolean }>>(
        `/functional_groups/${id}`
      );
      return res.data.data;
    } catch (err) {
      return this.handleError(err);
    }
  }

  async upsertFunctionalGroupsBatch(
    moleculeId: number,
    functional_groups: Array<{
      name: string;
      description?: string;
      themes?: string[];
    }>
  ): Promise<ApiResponse<FunctionalGroup[]>> {
    try {
      const res = await this.http.post<ApiResponse<FunctionalGroup[]>>("/functional_groups/upsert_batch", {
        molecule_id: moleculeId,
        functional_groups
      });
      return res.data;
    } catch (err) {
      return this.handleError(err);
    }
  }

  async getFunctionalGroupNeighbors(
    id: number,
    params?: { limit?: number; molecule_id?: number; chemical_class_id?: number; include_embedding?: boolean }
  ): Promise<FunctionalGroup[]> {
    try {
      const res = await this.http.get<ApiResponse<FunctionalGroup[]>>(`/functional_groups/${id}/neighbors`, { params });
      return res.data.data;
    } catch (err) {
      return this.handleError(err);
    }
  }

  async generateFunctionalGroupEmbedding(id: number, sync = true): Promise<unknown> {
    try {
      const res = await this.http.post<ApiResponse<unknown>>(
        `/functional_groups/${id}/generate_embedding`,
        {},
        {
          params: { sync }
        }
      );
      return res.data.data;
    } catch (err) {
      return this.handleError(err);
    }
  }

  async populateFunctionalGroups(moleculeId?: number, sync = false): Promise<unknown> {
    try {
      const res = await this.http.post<ApiResponse<unknown>>(
        "/functional_groups/populate",
        {},
        {
          params: { molecule_id: moleculeId, sync }
        }
      );
      return res.data.data;
    } catch (err) {
      return this.handleError(err);
    }
  }

  // Clusters & Snapshots
  async computeClusters(params?: {
    target_type?: "Molecule" | "FunctionalGroup";
    level?: number;
    full_coverage?: boolean;
    force?: boolean;
  }): Promise<LiveClusterResult> {
    try {
      const res = await this.http.get<ApiResponse<LiveClusterResult>>("/clusters", { params });
      return res.data.data;
    } catch (err) {
      return this.handleError(err);
    }
  }

  async createClusterSnapshot(data: {
    target_type: "Molecule" | "FunctionalGroup";
    level: number;
    full_coverage?: boolean;
    title: string;
  }): Promise<ClusterSnapshot> {
    try {
      const res = await this.http.post<ApiResponse<ClusterSnapshot>>("/clusters/snapshot", data);
      return res.data.data;
    } catch (err) {
      return this.handleError(err);
    }
  }

  async listClusterSnapshots(params?: {
    target_type?: "Molecule" | "FunctionalGroup";
    include_groups?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<ClusterSnapshot[]>> {
    try {
      const res = await this.http.get<ApiResponse<ClusterSnapshot[]>>("/cluster_snapshots", { params });
      return res.data;
    } catch (err) {
      return this.handleError(err);
    }
  }

  async getClusterSnapshot(
    id: number,
    params?: {
      include_groups?: boolean;
      include_members?: boolean;
      include_reports?: boolean;
    }
  ): Promise<ClusterSnapshot> {
    try {
      const res = await this.http.get<ApiResponse<ClusterSnapshot>>(`/cluster_snapshots/${id}`, { params });
      return res.data.data;
    } catch (err) {
      return this.handleError(err);
    }
  }

  async deleteClusterSnapshot(id: number): Promise<{ id: number; title: string; deleted: boolean }> {
    try {
      const res = await this.http.delete<ApiResponse<{ id: number; title: string; deleted: boolean }>>(
        `/cluster_snapshots/${id}`
      );
      return res.data.data;
    } catch (err) {
      return this.handleError(err);
    }
  }

  async listClusterGroups(
    clusterSnapshotId: number,
    params?: { include_members?: boolean }
  ): Promise<ApiResponse<ClusterGroup[]>> {
    try {
      const res = await this.http.get<ApiResponse<ClusterGroup[]>>(
        `/cluster_snapshots/${clusterSnapshotId}/cluster_groups`,
        { params }
      );
      return res.data;
    } catch (err) {
      return this.handleError(err);
    }
  }

  async getClusterGroup(id: number, params?: { include_members?: boolean }): Promise<ClusterGroup> {
    try {
      const res = await this.http.get<ApiResponse<ClusterGroup>>(`/cluster_groups/${id}`, { params });
      return res.data.data;
    } catch (err) {
      return this.handleError(err);
    }
  }

  // Synthesis Reports
  async listClusterReports(params?: {
    cluster_snapshot_id?: number;
    target_type?: "Molecule" | "FunctionalGroup";
    status?: string;
    is_detailed?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<ClusterReport[]>> {
    try {
      const res = await this.http.get<ApiResponse<ClusterReport[]>>("/cluster_reports", { params });
      return res.data;
    } catch (err) {
      return this.handleError(err);
    }
  }

  async getClusterReport(
    id: number,
    params?: {
      include_summaries?: boolean;
      include_sub_reports?: boolean;
    }
  ): Promise<ClusterReport> {
    try {
      const res = await this.http.get<ApiResponse<ClusterReport>>(`/cluster_reports/${id}`, { params });
      return res.data.data;
    } catch (err) {
      return this.handleError(err);
    }
  }

  async createClusterReport(data: {
    cluster_snapshot_id: number;
    prompt: string;
  }): Promise<ClusterReport> {
    try {
      const res = await this.http.post<ApiResponse<ClusterReport>>("/cluster_reports", data);
      const report = res.data.data;
      if (res.data.meta && (res.data.meta as Record<string, unknown>).job_id) {
        report.job_id = (res.data.meta as Record<string, unknown>).job_id as string;
      }
      return report;
    } catch (err) {
      return this.handleError(err);
    }
  }

  async deleteClusterReport(id: number): Promise<{ id: number; title: string; deleted: boolean }> {
    try {
      const res = await this.http.delete<ApiResponse<{ id: number; title: string; deleted: boolean }>>(
        `/cluster_reports/${id}`
      );
      return res.data.data;
    } catch (err) {
      return this.handleError(err);
    }
  }

  async deepSynthesis(reportId: number, data?: { batch_size?: number }): Promise<ClusterReport> {
    try {
      const res = await this.http.post<ApiResponse<ClusterReport>>(
        `/cluster_reports/${reportId}/deep_synthesis`,
        data || {}
      );
      const report = res.data.data;
      if (res.data.meta && (res.data.meta as Record<string, unknown>).job_id) {
        report.job_id = (res.data.meta as Record<string, unknown>).job_id as string;
      }
      return report;
    } catch (err) {
      return this.handleError(err);
    }
  }

  async waitForClusterReport(
    id: number,
    pollIntervalMs = 5000,
    timeoutMs = 600000
  ): Promise<ClusterReport> {
    const startTime = Date.now();
    let lastReport: ClusterReport | null = null;
    while (Date.now() - startTime < timeoutMs) {
      const report = await this.getClusterReport(id, {
        include_summaries: false,
        include_sub_reports: false
      });
      lastReport = report;
      if (report.status === "completed") {
        return await this.getClusterReport(id, {
          include_summaries: false,
          include_sub_reports: true
        });
      }
      if (report.status === "failed") {
        throw new ChemistApiError(
          report.error_message || `Cluster report ${id} failed`,
          "report_failed"
        );
      }
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }
    if (lastReport && (lastReport.status === "running" || lastReport.status === "queued")) {
      return {
        ...lastReport,
        timed_out: true,
        is_running: true
      };
    }
    throw new ChemistApiError(
      `Cluster report ${id} timed out after ${timeoutMs}ms while waiting for completion`,
      "report_timeout"
    );
  }

  async listClusterReportSummaries(clusterReportId: number): Promise<ClusterReportSummary[]> {
    try {
      const res = await this.http.get<ApiResponse<ClusterReportSummary[]>>(
        `/cluster_reports/${clusterReportId}/summaries`
      );
      return res.data.data;
    } catch (err) {
      return this.handleError(err);
    }
  }

  async getClusterReportSummary(id: number): Promise<ClusterReportSummary> {
    try {
      const res = await this.http.get<ApiResponse<ClusterReportSummary>>(`/cluster_report_summaries/${id}`);
      return res.data.data;
    } catch (err) {
      return this.handleError(err);
    }
  }

  async listClusterSubReports(clusterReportId: number): Promise<ClusterSubReport[]> {
    try {
      const res = await this.http.get<ApiResponse<ClusterSubReport[]>>(
        `/cluster_reports/${clusterReportId}/sub_reports`
      );
      return res.data.data;
    } catch (err) {
      return this.handleError(err);
    }
  }

  async getClusterSubReport(id: number): Promise<ClusterSubReport> {
    try {
      const res = await this.http.get<ApiResponse<ClusterSubReport>>(`/cluster_sub_reports/${id}`);
      return res.data.data;
    } catch (err) {
      return this.handleError(err);
    }
  }

  // Jobs
  async listJobs(limit = 20): Promise<JobStatus[]> {
    try {
      const res = await this.http.get<ApiResponse<JobStatus[]>>("/jobs", { params: { limit } });
      return res.data.data;
    } catch (err) {
      return this.handleError(err);
    }
  }

  async getJob(jobId: string): Promise<JobStatus> {
    try {
      const res = await this.http.get<ApiResponse<JobStatus>>(`/jobs/${jobId}`);
      return res.data.data;
    } catch (err) {
      return this.handleError(err);
    }
  }

  async waitForJob(jobId: string, pollIntervalMs = 2000, timeoutMs = 60000): Promise<JobStatus> {
    const startTime = Date.now();
    let lastJob: JobStatus | null = null;
    while (Date.now() - startTime < timeoutMs) {
      const job = await this.getJob(jobId);
      lastJob = job;
      if (job.status === "completed") {
        return job;
      }
      if (job.status === "failed") {
        throw new ChemistApiError(
          job.error || job.message || `Job ${jobId} failed`,
          "job_failed"
        );
      }
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }
    if (lastJob && (lastJob.status === "running" || lastJob.status === "queued")) {
      return {
        ...lastJob,
        timed_out: true,
        is_running: true,
        message: `Job ${jobId} is still ${lastJob.status} in the background after ${timeoutMs}ms. Do NOT retry or duplicate.`
      };
    }
    throw new ChemistApiError(
      `Job ${jobId} timed out after ${timeoutMs}ms while waiting for completion`,
      "job_timeout"
    );
  }
}
