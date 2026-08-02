import http from "http";
import app from "./app.js";
import { connectDatabase } from "./config/database.js";
import { env } from "./config/env.js";
import { initSocketServer } from "./socketServer.js";

const server = http.createServer(app);
initSocketServer(server);

console.log(
  "Connecting to Mongo URI:",
  env.mongoUri.replace(/:([^@]+)@/, ":****@")
);


process.on("unhandledRejection", (reason: any) => {
  console.error("Unhandled promise rejection:", reason?.message || reason);
});

process.on("uncaughtException", (error: Error) => {
  console.error("Uncaught exception:", error.message);
  process.exit(1);
});

function shutdown(signal: string) {
  console.log(`${signal} received. Shutting down gracefully.`);
  server.close(() => {
    console.log("Server closed.");
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

async function startServer() {
  try {
    await connectDatabase();
    console.log(`Connected to MongoDB`);

    server.listen(env.port, () => {
      console.log(`Server is running on port ${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
}

void startServer();