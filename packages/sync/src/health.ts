/**
 * Health Check HTTP Server
 *
 * Minimal HTTP server on configurable port (default 8080)
 * for Railway health monitoring.
 *
 * GET /health → { status: "ok", uptime, lastJobs }
 */

import * as http from "http";
import { prisma } from "@var/database";
import { worker } from "./config";

let server: http.Server | null = null;

export function startHealthServer(): http.Server {
  const port = worker.healthPort;

  server = http.createServer(async (req, res) => {
    if (req.method === "GET" && (req.url === "/health" || req.url === "/" || req.url === "/api/health")) {
      try {
        const lastJobs = await prisma.syncJob.findMany({
          orderBy: { startedAt: "desc" },
          take: 5,
          select: {
            id: true,
            jobType: true,
            distributor: true,
            status: true,
            itemsProcessed: true,
            startedAt: true,
            completedAt: true,
          },
        });

        const ftpStates = await prisma.ftpSyncState.findMany({
          select: {
            distributor: true,
            feedType: true,
            lastStatus: true,
            lastRunAt: true,
            itemsProcessed: true,
          },
        });

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            status: "ok",
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            lastJobs,
            ftpStates,
          }),
        );
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            status: "error",
            error: err instanceof Error ? err.message : "Unknown error",
          }),
        );
      }
    } else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not found" }));
    }
  });

  server.listen(port, () => {
    console.log(`[health] Server listening on port ${port}`);
  });

  return server;
}

export function stopHealthServer(): Promise<void> {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => resolve());
    } else {
      resolve();
    }
  });
}
