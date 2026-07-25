import app from "./app.js";
import { connectDatabase } from "./config/database.js";
import { env } from "./config/env.js";
import connectCloudinary from "./config/cloudinary.js";
import { initSocketServer } from './socketServer.js';
import http from 'http';

const server = http.createServer(app);
initSocketServer(server);


connectCloudinary();

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