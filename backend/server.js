import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connect from "./src/db/connect.js";
import cookieParser from "cookie-parser";
import fs from "node:fs";
import errorHandler from "./src/helpers/errorhandler.js";
import { createServer } from "http";
import { Server } from "socket.io";

dotenv.config();

const port = process.env.PORT || 8000;

const app = express();
const server = createServer(app);

// CORS configuration supporting single/multiple origins and Vercel deployments
const configuredOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",").map((url) => url.trim().replace(/\/$/, ""))
  : [];

const allowedOrigins = [
  ...configuredOrigins,
  "https://snippet-master-sepia.vercel.app",
  "https://snippet-master-one.vercel.app",
  "http://localhost:3000",
].filter(Boolean);

const isOriginAllowed = (origin) => {
  if (!origin) return true; // allow curl, mobile apps, server-to-server
  const clean = origin.replace(/\/$/, "");
  return (
    allowedOrigins.includes(clean) ||
    clean.endsWith(".vercel.app") ||
    clean.includes("localhost") ||
    clean.includes("127.0.0.1")
  );
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cookie", "X-Requested-With"],
};

// Socket.IO setup
const io = new Server(server, {
  cors: corsOptions,
});

// middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join user to their personal room
  socket.on("join-user-room", (userId) => {
    socket.join(`user-${userId}`);
    console.log(`User ${userId} joined their room`);
  });

  // Join public snippets room
  socket.on("join-public-room", () => {
    socket.join("public-snippets");
    console.log("User joined public snippets room");
  });

  // Handle snippet creation
  socket.on("snippet-created", (snippet) => {
    // Broadcast to all users in public room
    socket.to("public-snippets").emit("new-snippet", snippet);
  });

  // Handle snippet updates
  socket.on("snippet-updated", (snippet) => {
    socket.to("public-snippets").emit("snippet-updated", snippet);
  });

  // Handle snippet deletion
  socket.on("snippet-deleted", (snippetId) => {
    socket.to("public-snippets").emit("snippet-deleted", snippetId);
  });

  // Handle likes
  socket.on("snippet-liked", (data) => {
    socket.to("public-snippets").emit("snippet-liked", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Make io available to routes
app.set("io", io);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "OK", 
    message: "Server is running",
    timestamp: new Date().toISOString()
  });
});

//routes
const routeFiles = fs.readdirSync("./src/routes");

routeFiles.forEach((file) => {
  // use dynamic import
  import(`./src/routes/${file}`)
    .then((route) => {
      app.use("/api/v1", route.default);
    })
    .catch((err) => {
      console.log("Failed to load route file", err);
      // Don't exit the process, just log the error
    });
});

// error handler middleware - must be after routes
app.use(errorHandler);

const startServer = async () => {
  try {
    await connect();

    server.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.log("Failed to start server.....", error.message);
    process.exit(1);
  }
};

startServer();
