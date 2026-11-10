import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { disconnectDb } from "@hr-automation/db";
import {
  WORKFLOW_EXECUTIONS_QUEUE,
  createRedisConnection,
  getRedisUrl,
} from "@hr-automation/queue";
import { startAllConsumers } from "./consumers";

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
dotenv.config({ path: path.join(rootDir, ".env") });

const WORKER_ID = process.env.WORKER_ID || `worker-${process.pid}`;
const CONCURRENCY = Number(process.env.WORKER_CONCURRENCY || 1);

/**
 * Boot only — consumers live under src/consumers/.
 * Node execution lives in packages/workflow-engine (not src/executors/).
 *
 * Flow: Redis job → consumer → process-job (claim) → workflow-engine
 */
async function main() {
  if (!getRedisUrl()) {
    console.error(
      "[worker] REDIS_URL is required. Run: docker compose up -d redis\n" +
        "         Then set REDIS_URL=redis://localhost:6379 in .env",
    );
    process.exit(1);
  }

  console.log(`[worker] starting ${WORKER_ID}`);
  console.log(
    `[worker] queue=${WORKFLOW_EXECUTIONS_QUEUE} concurrency=${CONCURRENCY}`,
  );

  const connection = createRedisConnection();
  connection.on("connect", () => console.log("[worker] Redis connected"));
  connection.on("error", (err) =>
    console.error("[worker] Redis error", err.message),
  );

  const consumers = startAllConsumers({
    connection,
    workerId: WORKER_ID,
    concurrency: CONCURRENCY,
  });

  const shutdown = async (signal: string) => {
    console.log(`[worker] ${signal} — shutting down`);
    await consumers.closeAll();
    await connection.quit().catch(() => undefined);
    await disconnectDb();
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch(async (err) => {
  console.error("[worker] fatal", err);
  await disconnectDb().catch(() => undefined);
  process.exit(1);
});
