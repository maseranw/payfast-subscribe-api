import express, { Express, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";

import { errorMiddleware } from "./middleware/ErrorMiddleware";
import {
  handlePaymentCreation,
  handleCancel,
  handlePause,
  handleUnpause,
  handleFetch,
} from "./handlers/PayFastHandlers";
import buildPayfastRouter from "@ngelekanyo/payfast-subscribe";
import { setSocketIOInstance } from "./socket";

const app: Express = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: [
      process.env.CLIENT_APP_URL || "http://localhost:5173",
      process.env.SUPABASE_URL || "https://Project-ID.supabase.co",
    ],
    credentials: true,
  },
});

// Store it globally
setSocketIOInstance(io);

io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);

  // NEW: Join user-specific room
  socket.on("join_user_room", (userId) => {
    console.log(`📡 Socket ${socket.id} joined room: ${userId}`);
    socket.join(userId);
  });

  socket.on("leave_user_room", (userId) => {
    console.log(`📡 Socket ${socket.id} left the room: ${userId}`);
    socket.leave(userId);
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
  });
});

// CORS configuration
const corsOptions = {
  origin: [
    process.env.CLIENT_APP_URL || "http://localhost:5173",
    process.env.SUPABASE_URL || "https://Project-ID.supabase.co",
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
server.listen(PORT, () => {
  console.log(`🚀 Test server running on http://localhost:${PORT}`);
});
