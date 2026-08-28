import { DescribeTableCommand, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import type { DashboardSummary } from "@nexora/contracts";
import type { AppConfig } from "./config.js";

export interface DynamoContext {
  raw: DynamoDBClient;
  document: DynamoDBDocumentClient;
}

export function createDynamoContext(config: AppConfig): DynamoContext {
  const raw = new DynamoDBClient({
    region: config.AWS_REGION,
    endpoint: config.AWS_ENDPOINT_URL,
    credentials:
      config.APP_ENV === "local"
        ? {
            accessKeyId: config.AWS_ACCESS_KEY_ID ?? "test",
            secretAccessKey: config.AWS_SECRET_ACCESS_KEY ?? "test",
            sessionToken: config.AWS_SESSION_TOKEN
          }
        : undefined
  });

  return {
    raw,
    document: DynamoDBDocumentClient.from(raw, {
      marshallOptions: { removeUndefinedValues: true }
    })
  };
}

async function countPartition(
  context: DynamoContext,
  tableName: string,
  partitionKey: string
): Promise<number> {
  const result = await context.document.send(
    new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: "PK = :pk",
      ExpressionAttributeValues: { ":pk": partitionKey },
      Select: "COUNT"
    })
  );

  return result.Count ?? 0;
}

export async function readDashboard(
  context: DynamoContext,
  config: AppConfig
): Promise<DashboardSummary> {
  try {
    await context.raw.send(new DescribeTableCommand({ TableName: config.DYNAMODB_TABLE }));

    const [customers, products, sales, lowStockCount] = await Promise.all([
      countPartition(context, config.DYNAMODB_TABLE, "TENANT#demo#CUSTOMERS"),
      countPartition(context, config.DYNAMODB_TABLE, "TENANT#demo#PRODUCTS"),
      countPartition(context, config.DYNAMODB_TABLE, "TENANT#demo#SALES"),
      countPartition(context, config.DYNAMODB_TABLE, "TENANT#demo#NOTIFICATIONS")
    ]);

    return {
      infrastructure: "ready",
      customers,
      products,
      salesTotalMinor: sales * 0,
      stockUnits: 0,
      lowStockCount,
      currency: "CLP",
      updatedAt: new Date().toISOString()
    };
  } catch (error) {
    const name = error instanceof Error ? error.name : "UnknownError";
    if (name !== "ResourceNotFoundException") {
      throw error;
    }

    return {
      infrastructure: "pending",
      customers: 0,
      products: 0,
      salesTotalMinor: 0,
      stockUnits: 0,
      lowStockCount: 0,
      currency: "CLP",
      updatedAt: new Date().toISOString()
    };
  }
}
