const express = require("express");
const morgan = require("morgan");
const colors = require("colors");
const cors = require("cors");
require("dotenv").config();
// Custom Imports
const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");
const userRouter = require("./routes/userRoutes");
const savedSearchRouter = require("./routes/savedSearchRoutes");
const paymentRouter = require("./routes/paymentRoutes");
const uploadRouter = require("./routes/uploadRoutes");
const webhookRouter = require("./routes/webhookRoutes");
const roomRouter = require("./routes/roomRoutes");
const providerRouter = require("./routes/providerRoutes");
const stayRouter = require("./routes/stayRoutes");
const { globalLimiter } = require("./middleware/rateLimiter");

const listingRoutes = require("./routes/listingRoutes");
const adminRouter = require("./routes/adminRoutes");
const bookingRouter = require("./routes/bookingRoutes");

const rawFrontendUrl = process.env.FRONTEND_URL || "";
const corsOrigin = rawFrontendUrl
  ? rawFrontendUrl.replace(/\/$/, "")
  : "*";
const corsOptions = {
  origin: corsOrigin,
  methods: "*",
  allowedHeaders: "*",
  credentials: true,
};

const app = express();
app.set("trust proxy", 1);
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(globalLimiter);

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}
app.use("/webhooks", webhookRouter);
app.use(express.json({ limit: "10kb" }));

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// ROUTES
app.use("/api/v1/users", userRouter);
app.use("/api/v1/saved-searches", savedSearchRouter);
app.use("/api/v1/payments", paymentRouter);
app.use("/api/v1/uploads", uploadRouter);
app.use("/api/v1/rooms", roomRouter);
app.use("/api/v1/providers", providerRouter);
// Listings routes
// Primary (matches client + SRS)
app.use("/api/v1/listings", listingRoutes);
// Backwards-compatible alias (older code may still call /api/listings)
app.use("/api/listings", listingRoutes);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/bookings", bookingRouter);
app.use("/api/v1/stays", stayRouter);

// PRODUCTION SETUP
app.get("/", (req, res) => {
  res.status(200).json({ status: "ok", message: "Creapy API is running." });
});

app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
