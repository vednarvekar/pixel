import express, { type NextFunction, type Request, type Response } from "express"
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MulterError } from "multer";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import dotenv from "dotenv"
dotenv.config({ path: path.resolve(__dirname, "../.env") })

import imageRoutes from "./routes/image_routes.js"
import { preloadHashes } from "./service/visualSearch.service.js"
import { startEmbeddedPythonModel, stopEmbeddedPythonModel } from "./service/pythonModel.service.js";
import { ensureImagesTable, getUploadsRoot } from "./service/imageHistory.service.js";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const uploadsDirectory = getUploadsRoot();

app.use(cors({
    origin: "*",
    methods: ["GET","POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}))
app.use(express.json());
app.use("/uploads", express.static(uploadsDirectory));

app.get("/", (_req, res) => {
  res.status(200).send("OK");
});

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json("OK");
});

app.use("/api/images", imageRoutes);

app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof MulterError && err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json("Image must be under 5MB");
    }

    if (err instanceof Error && err.message.includes("Only JPG, PNG, and WEBP are supported")) {
        return res.status(400).json(err.message);
    }

    if (err) {
        console.error("Unhandled server error:", err);
        return res.status(500).json("System failure");
    }

    next();
});

console.log("Server is starting.....");

app.listen(PORT, () => {
    console.log(`🚀 TS Backend listening on port ${PORT}`);
    console.log(process.env.DATABASE_URL);

    // Load heavy dependencies AFTER server is reachable
    (async () => {
        try {
            await ensureImagesTable();
            console.log("Images table is ready.");

            await startEmbeddedPythonModel();
            console.log("Python model process is ready.");

            await preloadHashes();
            console.log("Hashes preloaded! System is ready🔥.");
        } catch (error) {
            console.error("Startup dependency initialization failed:", error);
        }
    })();
});

process.on("SIGINT", () => {
  stopEmbeddedPythonModel();
  process.exit(0);
});

process.on("SIGTERM", () => {
  stopEmbeddedPythonModel();
  process.exit(0);
});
