import app from "./app";
import { connectDatabase } from "./config/database";
import { env } from "./config/env";

async function startServer() {
  try {
    await connectDatabase();
    console.log(`Connected to MongoDB`);

    app.listen(env.port, () => {
      console.log(`Server is running on port ${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
}

void startServer();