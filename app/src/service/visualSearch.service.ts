import sharp from "sharp";
import imghash from "imghash";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const knownRealHashes: string[] = [];
const knownAiHashes: string[] = [];

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CACHE_FILE = path.join(__dirname, "hash_cache.json");

export async function preloadHashes() {
    // --- 1. THE FAST WAY: Load from Cache ---
    if (fs.existsSync(CACHE_FILE)) {
        console.log("⚡ Found cache! Loading hashes from JSON...");
        const data = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
        
        knownRealHashes.push(...data.real);
        knownAiHashes.push(...data.ai);
        
        console.log(`✅ Loaded ${data.real.length + data.ai.length} hashes from memory.`);
        return; // We are done! Don't look at the folders.
    }

    // --- 2. THE SLOW WAY: First time setup ---
    console.log("🐢 No cache found. Calculating hashes (first time only)...");
    
    const realDir = path.join(__dirname, "hash-db/real");
    const aiDir = path.join(__dirname, "hash-db/ai");

    const isImage = (fileName: string) => {
        const ext = path.extname(fileName).toLowerCase();
        return [".jpg", ".jpeg", ".png", ".webp"].includes(ext);
    };

    // Helper function to process a directory
    async function processDirectory(dir: string, targetArray: string[]) {
        if (!fs.existsSync(dir)) return;
        const files = fs.readdirSync(dir);
        for (const file of files) {
            if (isImage(file)) {
                try {
                    const hash = await imghash.hash(path.join(dir, file), 16);
                    targetArray.push(hash);
                } catch (err) {
                    console.error(`❌ Error hashing ${file}:`, err);
                }
            }
        }
    }

    // Run the slow processing
    await processDirectory(realDir, knownRealHashes);
    await processDirectory(aiDir, knownAiHashes);

    // --- 3. SAVE FOR FUTURE ---
    const cacheData = { real: knownRealHashes, ai: knownAiHashes };
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cacheData));
    console.log("💾 Cache created! Server will start instantly next time.");
}




function hammingDistance(a: string, b: string) {
    let dist = 0;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) dist++;
    }
    return dist;
}




export async function checkWebScore(buffer: Buffer): Promise<number> {
    const tempPath = "temp_img.jpg";
    await sharp(buffer).jpeg().toFile(tempPath);

    const uploadedHash = await imghash.hash(tempPath, 16);
    fs.unlinkSync(tempPath);

    let minReal = Infinity;
    let minAi = Infinity;

    for (const h of knownRealHashes) {
        minReal = Math.min(minReal, hammingDistance(uploadedHash, h));
    }

    for (const h of knownAiHashes) {
        minAi = Math.min(minAi, hammingDistance(uploadedHash, h));
    }

    if (minAi < minReal && minAi < 10) return 0.8;
    if (minReal < minAi && minReal < 10) return 0.1;

    return 0.5;
}
