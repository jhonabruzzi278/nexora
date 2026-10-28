import { z } from "zod";

const environmentSchema = z.object({
  APP_ENV: z.enum(["local", "test", "production"]).default("local"),
  API_PORT: z.coerce.number().int().positive().default(3000),
  WEB_ORIGIN: z.string().default("http://localhost:5173"),
  AWS_REGION: z.string().default("us-east-1"),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_SESSION_TOKEN: z.string().optional(),
  AWS_ENDPOINT_URL: z.string().url().optional(),
  DYNAMODB_TABLE: z.string().min(3).default("nexora-local")
});

export type AppConfig = z.infer<typeof environmentSchema>;

export function loadConfig(environment: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = environmentSchema.parse(environment);

  const isLambda = Boolean(environment.AWS_LAMBDA_FUNCTION_NAME || environment.AWS_EXECUTION_ENV);
  if (
    !isLambda &&
    parsed.APP_ENV === "production" &&
    (parsed.AWS_ACCESS_KEY_ID || parsed.AWS_SECRET_ACCESS_KEY || parsed.AWS_SESSION_TOKEN)
  ) {
    throw new Error("Static AWS credentials are forbidden in production; use the Lambda IAM role");
  }

  return parsed;
}
