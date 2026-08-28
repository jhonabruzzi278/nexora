import { describe, expect, it } from "bun:test";
import { buildApp } from "../src/app.js";
import { loadConfig } from "../src/config.js";
import { handler } from "../src/lambda.js";

describe("health endpoint", () => {
  it("reports the API as healthy without requiring DynamoDB", async () => {
    const config = loadConfig({ APP_ENV: "test" });
    const app = await buildApp({ config, logger: false });

    const response = await app.inject({ method: "GET", url: "/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ status: "ok", service: "nexora-api" });
    await app.close();
  });
});

describe("AWS deployment safeguards", () => {
  it("rejects static AWS credentials in production", () => {
    expect(() =>
      loadConfig({
        APP_ENV: "production",
        AWS_ACCESS_KEY_ID: "should-not-be-in-lambda",
        AWS_SECRET_ACCESS_KEY: "should-not-be-in-lambda"
      })
    ).toThrow("Static AWS credentials are forbidden in production");
  });

  it("serves Lambda health without initializing DynamoDB", async () => {
    const response = await handler({
      rawPath: "/health",
      requestContext: { http: { method: "GET" } }
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toMatchObject({ status: "ok", service: "nexora-api" });
  });
});
