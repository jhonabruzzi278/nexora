import cors from "@fastify/cors";
import Fastify from "fastify";
import type { ApiHealth } from "@nexora/contracts";
import { loadConfig, type AppConfig } from "./config.js";
import { createDynamoContext, readDashboard } from "./dynamo.js";

export interface BuildAppOptions {
  config?: AppConfig;
  logger?: boolean;
}

export async function buildApp(options: BuildAppOptions = {}) {
  const config = options.config ?? loadConfig();
  const dynamo = createDynamoContext(config);
  const app = Fastify({
    logger: options.logger ?? true,
    requestIdHeader: "x-request-id"
  });

  await app.register(cors, {
    origin: config.WEB_ORIGIN,
    methods: ["GET", "POST", "PUT", "DELETE"]
  });

  app.get("/health", async (): Promise<ApiHealth> => ({
    status: "ok",
    service: "nexora-api",
    timestamp: new Date().toISOString()
  }));

  app.get("/api/v1/dashboard", async (_request, reply) => {
    try {
      return await readDashboard(dynamo, config);
    } catch (error) {
      app.log.error({ error }, "Unable to read dashboard from DynamoDB");
      return reply.code(503).send({
        code: "INFRASTRUCTURE_UNAVAILABLE",
        message: "DynamoDB is not available yet"
      });
    }
  });

  app.addHook("onClose", async () => {
    dynamo.raw.destroy();
  });

  return app;
}
