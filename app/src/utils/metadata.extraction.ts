import ExifReader from "exifreader"
import { analyzeImageMetadata } from "../service/metadata.service.js";

export async function checkMetaData(buffer: Buffer) {
    try {
        const tags = ExifReader.load(buffer, {expanded: true}) as any;
        const bufferString = buffer.toString('utf8', 0, 5000); // Check first 5kb
        const c2paDetected = bufferString.includes('c2pa') || !!tags?.xmp?.['xmp:CreatorTool']?.description?.includes('AI');

        if (c2paDetected) {
            tags.c2paPresent = true; 
        }

        const analysis = await analyzeImageMetadata(tags);

        return {
            rawTags: tags,
            analysis
        }

    } catch (error) {
        console.error("Metadata Extraction Failed:", error);
        return {
            analysis: { score: 20, evidence: ["Failed to parse metadata / Stripped"], confidence: "Low", override: false }
        };
    }
}