import express, { Express, Request, Response } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
dotenv.config();

import { validateEnv } from "./config/env";

validateEnv();

import { errorMiddleware } from "./middleware/ErrorMiddleware";
import {
  requireSubscriptionOwnership,
  requireInitiatePaymentOwnership,
} from "./middleware/RequireSubscriptionOwnership";
import {
  handlePaymentCreation,
  handleCancel,
  handlePause,
  handleUnpause,
  handleFetch,
} from "./handlers/PayFastHandlers";
import buildPayfastRouter from "@ngelekanyo/payfast/server";

const app: Express = express();

const corsOptions = {
  origin: [
    process.env.CLIENT_APP_URL || "http://localhost:5173",
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

app.use(cors(corsOptions));
app.use(express.json());

const payfastRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/payfast/initiate", requireInitiatePaymentOwnership);
app.use("/api/payfast/cancel/:token/:subscriptionId", requireSubscriptionOwnership);
app.use("/api/payfast/cancel/:token", requireSubscriptionOwnership);
app.use("/api/payfast/pause/:token", requireSubscriptionOwnership);
app.use("/api/payfast/unpause/:token", requireSubscriptionOwnership);
app.use("/api/payfast/fetch/:token", requireSubscriptionOwnership);

app.use(
  "/api/payfast",
  payfastRateLimiter,
  buildPayfastRouter(
    handlePaymentCreation,
    handleCancel,
    handlePause,
    handleUnpause,
    handleFetch
  )
);

app.get("/", (req: Request, res: Response) => {
  res.send("PayFast test server running");
});

app.use(errorMiddleware);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
});
