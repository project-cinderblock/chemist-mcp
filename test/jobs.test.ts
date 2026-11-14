import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { ChemistApiClient, ChemistApiError } from "../src/client/index.js";

describe("Job Polling & Waiting", () => {
  let mock: MockAdapter;
  let client: ChemistApiClient;

  beforeEach(() => {
    mock = new MockAdapter(axios);
    client = new ChemistApiClient({
      apiUrl: "http://localhost:3000/api/v1",
      timeoutMs: 5000
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    mock.restore();
    vi.useRealTimers();
  });

  it("polls job until completed status is returned", async () => {
    let callCount = 0;
    mock.onGet("http://localhost:3000/api/v1/jobs/test-job-uuid").reply(() => {
      callCount++;
      if (callCount < 2) {
        return [200, { data: { job_id: "test-job-uuid", status: "running" } }];
      }
      return [
        200,
        {
          data: {
            job_id: "test-job-uuid",
            status: "completed",
            result: { discovered: 8 }
          }
        }
      ];
    });

    const waitPromise = client.waitForJob("test-job-uuid", 50, 1000);

    // Fast-forward fake timer
    await vi.advanceTimersByTimeAsync(150);

    const result = await waitPromise;
    expect(result.status).toBe("completed");
    expect(callCount).toBe(2);
  });

  it("throws ChemistApiError when job fails", async () => {
    mock.onGet("http://localhost:3000/api/v1/jobs/failed-job-uuid").reply(200, {
      data: {
        job_id: "failed-job-uuid",
        status: "failed",
        error: "Ollama inference connection refused"
      }
    });

    const waitPromise = client.waitForJob("failed-job-uuid", 50, 1000);
    const rejectionPromise = expect(waitPromise).rejects.toThrowError(ChemistApiError);

    await vi.advanceTimersByTimeAsync(50);
    await rejectionPromise;
  });

  it("throws ChemistApiError on timeout", async () => {
    mock.onGet("http://localhost:3000/api/v1/jobs/slow-job-uuid").reply(200, {
      data: {
        job_id: "slow-job-uuid",
        status: "running"
      }
    });

    const waitPromise = client.waitForJob("slow-job-uuid", 50, 200);
    const timeoutExpectation = expect(waitPromise).rejects.toThrow(/timed out/);

    await vi.advanceTimersByTimeAsync(300);
    await timeoutExpectation;
  });
});
