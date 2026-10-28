import type { ApiHealth } from "@nexora/contracts";
import { buildApp } from "./app.js";
import { loadConfig } from "./config.js";

interface HttpApiEvent {
  rawPath?: string;
  rawQueryString?: string;
  headers?: Record<string, string>;
  requestContext?: {
    http?: {
      method?: string;
    };
  };
  body?: string;
  isBase64Encoded?: boolean;
}

let appPromise: ReturnType<typeof buildApp> | undefined;

function getApp() {
  if (!appPromise) {
    const config = loadConfig();
    appPromise = buildApp({ config, logger: false });
  }
  return appPromise;
}

export async function handler(event: HttpApiEvent) {
  const method = event.requestContext?.http?.method ?? "GET";
  const path = event.rawPath ?? "/";

  // Fast path para /health (sin esperar inicialización de DynamoDB)
  if (method === "GET" && path === "/health") {
    const health: ApiHealth = {
      status: "ok",
      service: "nexora-api",
      timestamp: new Date().toISOString()
    };
    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
        "x-content-type-options": "nosniff"
      },
      body: JSON.stringify(health)
    };
  }

  const app = await getApp();
  const url = path + (event.rawQueryString ? `?${event.rawQueryString}` : "");

  let payload: string | undefined = event.body;
  if (event.body && event.isBase64Encoded) {
    payload = Buffer.from(event.body, "base64").toString("utf-8");
  }

  const response = await app.inject({
    method: method as any,
    url,
    headers: event.headers,
    payload
  });

  return {
    statusCode: response.statusCode,
    headers: response.headers as Record<string, string>,
    body: response.body
  };
}

