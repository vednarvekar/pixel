import express,{type Request, type Response} from "express"
import multer from "multer";
import path from "node:path";
import fs from "node:fs/promises";
import { checkWebScore } from "../service/visualSearch.service.js";
import { checkMetaData } from "../utils/metadata.extraction.js";
import { fuseScores } from "../service/score.service.js";
import { predictWithPythonModel } from "../service/pythonModel.service.js";
import { getUploadsRoot, listScanHistory, saveScanRecord } from "../service/imageHistory.service.js";

const router = express.Router();
const uploadsRoot = getUploadsRoot();
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, uploadsRoot);
    },
    filename: (_req, file, cb) => {
      const extension = path.extname(file.originalname) || getExtensionFromMimeType(file.mimetype);
      const safeBaseName = path
        .basename(file.originalname, path.extname(file.originalname))
        .replace(/[^a-zA-Z0-9_-]/g, "-")
        .slice(0, 40) || "image";

      cb(null, `${Date.now()}-${safeBaseName}${extension}`);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // Limit to 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG, and WEBP are supported"));
    }
  }
});

function getExtensionFromMimeType(mimetype: string) {
  if (mimetype === "image/png") return ".png";
  if (mimetype === "image/webp") return ".webp";
  return ".jpg";
}

function buildImageUrl(req: Request, imagePath: string) {
  return `${req.protocol}://${req.get("host")}${imagePath}`;
}

router.get("/health", async(req: Request, res:Response) => {
    res.status(200).json("All OK")
})

router.get("/history", async (req: Request, res: Response) => {
    try {
        const scans = await listScanHistory();

        res.json(
          scans.map((scan) => ({
            id: String(scan.id),
            date: scan.createdAt.toISOString(),
            score: Math.round(scan.confidence),
            verdict: scan.verdict,
            thumbnail: buildImageUrl(req, scan.imagePath),
          }))
        );
    } catch (error) {
        console.error("History fetch failed:", error);
        res.status(500).json("System failure");
    }
});

router.post("/scan", upload.single("image"), async(req: Request, res:Response) => {
    try {
        if(!req.file){
            return res.status(400).json("No Image Uploaded")
        }

        const imageBuffer = await fs.readFile(req.file.path);


        // ------------- 1. Metadata Result &  --------------
        const metaScore = await checkMetaData(imageBuffer);


        // ------------- 2. Visual Search API --------------
        const webScore = await checkWebScore(imageBuffer);


        // ------------- 3. Model inference via embedded Python process ---------------
        const modelResponse = await predictWithPythonModel(imageBuffer, req.file.mimetype);


        // ------------- 4. Scoring ---------------
        const modelScore = modelResponse.ai_score;

        const fusionResult = fuseScores({
            modelScore,
            metaScore: metaScore.analysis.score,
            webScore,
            override: metaScore.analysis.override
        })
        console.log("MODEL RAW RESPONSE:", modelResponse);

        const imagePath = `/uploads/${req.file.filename}`;
        await saveScanRecord({
          imagePath,
          verdict: fusionResult.verdict,
          confidence: fusionResult.finalScore,
        });
        
        res.json({
          final_score: fusionResult.finalScore,
          verdict: fusionResult.verdict,
          reasoning: fusionResult.reasoning,
          image_path: imagePath,
          image_url: buildImageUrl(req, imagePath),
          breakdown: {
            model: Math.round(modelScore),
            metadata: Math.round(metaScore.analysis.score),
            web: Math.round(webScore)
          }
        })


    } catch (error) {
        if (req.file?.path) {
          await fs.unlink(req.file.path).catch(() => undefined);
        }
        console.error("Scan failed:", error);
        res.status(500).json("System failure");
    }
})


export default router;
