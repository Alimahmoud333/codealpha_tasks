import cors from "cors";
import express from "express";
import helmet from "helmet";
import env from "./config/env.js";
import errorHandler from "./middleware/errorHandler.js";
import notFound from "./middleware/notFound.js";
import routes from "./routes/index.js";

const app = express();

// Security headers. "cross-origin" lets the React app (another origin) display our images.
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// Only the configured frontend origin may call the API from a browser.
app.use(cors({ origin: env.clientOrigin }));

// Small JSON bodies only (uploads go through multer with its own 2 MB limit).
app.use(express.json({ limit: "10kb" }));

// Committed seed images, and user uploads. Neither folder can execute code.
app.use("/assets", express.static(env.publicDir, { dotfiles: "deny", index: false }));
app.use("/uploads", express.static(env.uploadsDir, { dotfiles: "deny", index: false }));

app.get("/api/health", (req, res) => res.json({ data: { status: "ok" } }));
app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

export default app;
