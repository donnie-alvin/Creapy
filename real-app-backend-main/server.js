const mongoose = require("mongoose");
require("dotenv").config();
// Custom Imports
const app = require("./app");

process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.log(err.name, err.message);
  process.exit(1);
});

/**
 * IMPORTANT:
 * If MongoDB is unreachable, Mongoose will buffer queries by default and your API
 * routes may appear to "hang" forever.
 *
 * We fail fast here so the frontend doesn't get stuck on infinite loaders.
 */
mongoose.set("bufferCommands", false);

const port = process.env.PORT || 5000;
const dbURI = process.env.MONGO_URI;

async function start() {
  if (!dbURI) {
    console.error(
      "Missing MONGO_URI in server/.env. Add your Mongo connection string and restart."
    );
    process.exit(1);
  }

  try {
    await mongoose.connect(dbURI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("Connected to MongoDB".cyan.underline.bold);
    console.log("Environment:", `${process.env.NODE_ENV || "development"}`.yellow);
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  }

  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });

  process.on("unhandledRejection", (err) => {
    console.log("UNHANDLED REJECTION! 💥 Shutting down...");
    console.log(err.name, err.message);
    server.close(() => {
      process.exit(1);
    });
  });
}

start();
