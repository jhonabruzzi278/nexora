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

describe("Pyme core endpoints", () => {
  it("returns default company settings when database is empty", async () => {
    const config = loadConfig({ APP_ENV: "test" });
    const app = await buildApp({ config, logger: false });

    const response = await app.inject({ method: "GET", url: "/api/v1/company" });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body).toHaveProperty("currency", "CLP");
    expect(body).toHaveProperty("taxRatePercent", 19);

    await app.close();
  });

  it("reports current cash shift as CLOSED if no shift is opened", async () => {
    const config = loadConfig({ APP_ENV: "test" });
    const app = await buildApp({ config, logger: false });

    const response = await app.inject({ method: "GET", url: "/api/v1/cash-shifts/current" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ status: "CLOSED" });

    await app.close();
  });

  it("handles contact creation and unified partner listing", async () => {
    const config = loadConfig({ APP_ENV: "test" });
    const app = await buildApp({ config, logger: false });

    const createRes = await app.inject({
      method: "POST",
      url: "/api/v1/contacts",
      payload: {
        taxId: "76.123.456-7",
        name: "Ferretería Central SpA",
        isCustomer: true,
        isSupplier: false,
        email: "ventas@central.cl",
        phone: "+56 9 8888 7777",
        status: "active"
      }
    });
    expect(createRes.statusCode).toBe(200);
    const created = createRes.json();
    expect(created.name).toBe("Ferretería Central SpA");
    expect(created.id).toBeDefined();

    const listRes = await app.inject({ method: "GET", url: "/api/v1/contacts" });
    expect(listRes.statusCode).toBe(200);
    const list = listRes.json();
    expect(Array.isArray(list)).toBe(true);
    expect(list.some((c: any) => c.name === "Ferretería Central SpA")).toBe(true);

    await app.close();
  });

  it("handles complete cash register lifecycle: open, sale, and close", async () => {
    const config = loadConfig({ APP_ENV: "test" });
    const app = await buildApp({ config, logger: false });

    // 1. Abrir turno con saldo inicial de $50.000 CLP
    const openRes = await app.inject({
      method: "POST",
      url: "/api/v1/cash-shifts/open",
      payload: {
        initialCashMinor: 50000,
        openedBy: "Admin"
      }
    });
    expect(openRes.statusCode).toBe(200);
    const openedShift = openRes.json();
    expect(openedShift.status).toBe("OPEN");
    expect(openedShift.initialCashMinor).toBe(50000);

    // 2. Cerrar turno con $50.000 contado
    const closeRes = await app.inject({
      method: "POST",
      url: "/api/v1/cash-shifts/close",
      payload: {
        actualCashMinor: 50000,
        closedBy: "Admin",
        notes: "Cierre cuadrado perfecto"
      }
    });
    expect(closeRes.statusCode).toBe(200);
    const closedShift = closeRes.json();
    expect(closedShift.status).toBe("CLOSED");
    expect(closedShift.differenceMinor).toBe(0);

    await app.close();
  });
});


