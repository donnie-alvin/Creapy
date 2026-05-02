require("dotenv").config();
// Custom Imports
const app = require("./app");
const prisma = require("./utils/prisma");

process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.log(err.name, err.message);
  prisma.$disconnect().finally(() => {
    process.exit(1);
  });
});

const port = process.env.PORT || 5000;

async function start() {
  let databaseConnected = false;

  try {
    await prisma.$connect();
    databaseConnected = true;
    console.log("Connected to Aurora PostgreSQL".cyan.underline.bold);
    console.log("Environment:", `${process.env.NODE_ENV || "development"}`.yellow);
  } catch (err) {
    console.error(
      "Failed to connect to Aurora PostgreSQL. Starting in degraded mode:",
      err.message
    );
    console.log(
      "Environment:",
      `${process.env.NODE_ENV || "development"}`.yellow
    );
  }

  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    if (!databaseConnected) {
      console.log(
        "Database connection unavailable at startup; requests that require PostgreSQL may fail."
      );
    }
  });

  process.on("unhandledRejection", (err) => {
    console.log("UNHANDLED REJECTION! 💥 Shutting down...");
    console.log(err.name, err.message);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(1);
    });
  });
}

start();
