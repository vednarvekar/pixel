import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { pool } from "../db/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsRoot = path.resolve(__dirname, "../uploads");
const schemaFilePath = path.resolve(__dirname, "../db/query.sql");

export interface SavedScanRecord {
  id: number;
  imagePath: string;
  verdict: string;
  confidence: number;
  createdAt: Date;
}

export function getUploadsRoot() {
  fs.mkdirSync(uploadsRoot, { recursive: true });
  return uploadsRoot;
}

export async function ensureImagesTable() {
  const schemaSql = await fsPromises.readFile(schemaFilePath, "utf8");
  await pool.query(schemaSql);
}

export async function saveScanRecord(input: {
  imagePath: string;
  verdict: string;
  confidence: number;
}) {
  await pool.query(
    `INSERT INTO images (image_path, result, confidence)
     VALUES ($1, $2, $3)`,
    [input.imagePath, input.verdict, input.confidence]
  );
}

export async function listScanHistory(limit = 24): Promise<SavedScanRecord[]> {
  const result = await pool.query<{
    id: number;
    image_path: string;
    result: string;
    confidence: number;
    created_at: Date;
  }>(
    `SELECT id, image_path, result, confidence, created_at
     FROM images
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit]
  );

  return result.rows.map((row) => ({
    id: row.id,
    imagePath: row.image_path,
    verdict: row.result,
    confidence: row.confidence,
    createdAt: row.created_at,
  }));
}
