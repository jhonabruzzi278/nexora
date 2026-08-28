import type { ApiHealth } from "@nexora/contracts";
import { loadConfig } from "./config.js";
import { createDynamoContext, readDashboard, type DynamoContext } from "./dynamo.js";

interface HttpApiEvent {
  rawPath?: string;
  requestContext?: {
    http?: {
      method?: string;
    };
  };
}

interface LambdaRuntime {
  config: ReturnType<typeof loadConfig>;
  dynamo: DynamoContext;
}

let runtime: LambdaRuntime | undefined;

function getRuntime(): LambdaRuntime {
  if (!runtime) {
    const config = loadConfig();
    runtime = { config, dynamo: createDynamoContext(config) };
  }

  return runtime;
}

function json(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff"
    },
    body: JSON.stringify(body)
  };
}

export async function handler(event: HttpApiEvent) {
  const method = event.requestContext?.http?.method ?? "GET";
  const path = event.rawPath ?? "/";

  if (method === "GET" && path === "/health") {
    const health: ApiHealth = {
      status: "ok",
      service: "nexora-api",
      timestamp: new Date().toISOString()
    };
    return json(200, health);
  }

  if (method === "GET" && path === "/api/v1/dashboard") {
    const current = getRuntime();
    try {
      return json(200, await readDashboard(current.dynamo, current.config));
    } catch (error) {
      console.error("Unable to read dashboard from DynamoDB", error);
      return json(503, {
        code: "INFRASTRUCTURE_UNAVAILABLE",
        message: "DynamoDB is not available"
      });
    }
  }

  return json(404, { code: "NOT_FOUND", message: "Route not found" });
}
