import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPaths = [
  path.resolve(__dirname, "../../.env"),
  path.resolve(__dirname, "../../../.env"),
];

let loaded = false;

export function loadEnv() {
  if (loaded) {
    return;
  }

  for (const envPath of envPaths) {
    dotenv.config({ path: envPath, override: false });
  }

  loaded = true;
}

export function getRequiredEnv(name: string) {
  loadEnv();

  const value = process.env[name];
  if (!value || typeof value !== "string" || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}
