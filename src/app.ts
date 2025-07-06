import express, { Express, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import { errorMiddleware } from "./middleware/ErrorMiddleware";
import {
  handlePaymentCreation,
  handleCancel,
  handlePause,
  handleUnpause,
  handleFetch,
} from "./handlers/PayFastHandlers";
import buildPayfastRouter from "@ngelekanyo/payfast-subscribe";

const app: Express = express();

// CORS configuration
const corsOptions = {
  origin: [
    process.env.CLIENT_APP_URL || "http://localhost:5173",
    process.env.SUPABASE_URL || "https://Project-ID.supabase.co"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount PayFast routes directly from buildPayfastRouter
app.use(
  "/api/payfast",
  buildPayfastRouter(
    handlePaymentCreation,
    handleCancel,
    handlePause,
    handleUnpause,
    handleFetch
  )
);

// Health check route
app.get("/", (req: Request, res: Response) => {
  res.send("PayFast test server running");
});

// Error handling middleware
app.use(errorMiddleware);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Test server running on http://localhost:${PORT}`);
});
