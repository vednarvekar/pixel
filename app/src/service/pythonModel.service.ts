import axios from "axios";
import FormData from "form-data";
import { spawn, type ChildProcessByStdio } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import type { Readable } from "node:stream";

const MODEL_API_URL = process.env.PYTHON_API_URL || "http://127.0.0.1:8000";
const START_EMBEDDED_MODEL = (process.env.START_EMBEDDED_MODEL || "true") !== "false";

let pythonProcess: ChildProcessByStdio<null, Readable, Readable> | null = null;
let modelReadyPromise: Promise<void> | null = null;

function resolveModelScriptPath(): string | null {
  const cwd = process.cwd();

  const candidates = [
    path.resolve(cwd, "resnet18/route/model_route.py"),
    path.resolve(cwd, "../resnet18/route/model_route.py"),
    path.resolve(cwd, "../../resnet18/route/model_route.py"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  console.error("Model search failed. Checked paths:", candidates);
  return null;
}

function resolvePythonBin(): string {
  if (process.env.PYTHON_BIN) return process.env.PYTHON_BIN;

  const cwd = process.cwd();
  const candidates = [
    path.resolve(cwd, ".venv/bin/python"),
    path.resolve(cwd, "venv/bin/python"),
    path.resolve(cwd, "../.venv/bin/python"),
    path.resolve(cwd, "../venv/bin/python"),
    path.resolve(cwd, "../../.venv/bin/python"),
    path.resolve(cwd, "../../venv/bin/python"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  return "python3";
}

async function waitForHealth(timeoutMs = 45000): Promise<void> {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    try {
      const response = await axios.get(`${MODEL_API_URL}/health`, { timeout: 1000 });
      if (response.status === 200) return;
    } catch {
      // Retry until timeout.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("Python model API did not become healthy in time");
}

export async function startEmbeddedPythonModel(): Promise<void> {
  if (!START_EMBEDDED_MODEL) return;
  if (pythonProcess) return;
  if (modelReadyPromise) return modelReadyPromise;

  modelReadyPromise = (async () => {
    const scriptPath = resolveModelScriptPath();
    const pythonBin = resolvePythonBin();
    if (!scriptPath) {
      throw new Error("Could not locate resnet18/route/model_route.py");
    }

    const proc = spawn(pythonBin, [scriptPath], {
      cwd: path.dirname(scriptPath),
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env,
    });
    console.log(`Starting embedded model with Python: ${pythonBin}`);
    pythonProcess = proc;

    proc.stdout.on("data", (data: Buffer) => {
      process.stdout.write(`[python-model] ${data.toString()}`);
    });
    proc.stderr.on("data", (data: Buffer) => {
      process.stderr.write(`[python-model] ${data.toString()}`);
    });

    proc.on("exit", (code, signal) => {
      console.error(`Python model process exited (code=${code}, signal=${signal})`);
      pythonProcess = null;
      modelReadyPromise = null;
    });

    const timeoutMs = Number(process.env.PYTHON_HEALTH_TIMEOUT_MS || 120000);
    await waitForHealth(Number.isFinite(timeoutMs) ? timeoutMs : 120000);
  })();

  return modelReadyPromise;
}

export async function predictWithPythonModel(imageBuffer: Buffer, mimeType: string) {
  const form = new FormData();
  form.append("file", imageBuffer, {
    filename: "upload.jpg",
    contentType: mimeType,
  });

  const response = await axios.post(`${MODEL_API_URL}/predict`, form, {
    headers: { ...form.getHeaders() },
    timeout: 30000,
  });

  return response.data;
}

export function stopEmbeddedPythonModel(): void {
  if (pythonProcess && !pythonProcess.killed) {
    pythonProcess.kill("SIGTERM");
  }
}
