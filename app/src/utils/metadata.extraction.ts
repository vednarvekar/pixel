import ExifReader from "exifreader"
import { analyzeImageMetadata } from "../service/metadata.service.js";

export async function checkMetaData(buffer: Buffer) {
    try {
        const tags = ExifReader.load(buffer, {expanded: true});

        const analysis = await analyzeImageMetadata(tags);

        return {
            rawTags: tags,
            analysis
        }

    } catch (error) {
        console.error("Metadata Extraction Failed:", error);
        return {
            analysis: { score: 0.2, evidence: ["Failed to parse metadata / Stripped"], confidence: "Low", override: false }
        };
    }
}