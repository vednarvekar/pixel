export async function analyzeImageMetadata(tags: any){
    let score = 0;
    const evidence: string[] = [];

    const rawJson = JSON.stringify(tags).toLowerCase();

    // 1. C2PA validation
    const hasC2PA = tags?.c2pa || rawJson.includes('c2pa');
    const isSignatureValid = rawJson.includes("claim signature valid") && rawJson.includes("data hash valid");

    if(hasC2PA && isSignatureValid) {
        return {
            score: 100,
            override: true,
            evidence: ["Cryptographically verified C2PA AI provenance"]
        }
    }

    // 2. Digital source type
    const digitalScource = tags?.xmp?.["dgimg: DigitalSourceType"]?.description || "";

    if(digitalScource.includes("trainedalgorithmicmedia")) {
        score += 70;
        evidence.push("IPTC DigitalSourceType = trainedAlgorithmicMedia");
    }

    // 3. Software trace detection
    const softwareKeywords = [
        "dalle",
        "midjourney",
        "stablediffusion",
        "sdxl",
        "openai",
        "openai api",
        "firefly",
        "gemini",
        "synthetic",
        "generative",
        "chatgpt"
    ];

    const matched = softwareKeywords.filter(k => rawJson.includes(k));
    if(matched.length > 0){
        // const traceScore = Math.min(60, matched.length * 20)
        score += 20;
        evidence.push(`Software traces detected: ${matched.join(", ")}`);
    }

    // 4. Hardware trace detection
    const hasMake = !!tags?.exif?.Make?.description;
    const hasModel = !!tags?.exif?.Model?.description;
    const hasISO = !!tags?.exif?.ISOSpeedRatings; 
    const hasExposure = !!tags?.exif?.ExposureTime;
    const hasLens = !!tags?.exif?.LensModel

    const hardwareStrength = [hasMake, hasModel, hasISO, hasExposure, hasLens].filter(Boolean).length;

    if(hardwareStrength >=4){
        score -= 50;
        evidence.push("Strong physical camera metadata detected");
    } else if (hardwareStrength >= 2) {
        score -= 25;
        evidence.push("Partial camera metadata detected");
    }

    // 5. Metadata stripped detection
    const hasExif = !!tags?.exif;
    const hasXmp = !!tags?.xmp;
    const hasIptc = !!tags?.iptc;

    if(!hasExif && !hasXmp && !hasIptc){
        score += 30
        evidence.push("Metadata appears stripped");
    }

    // 6. Total scoring
    score = Math.max(0, Math.min(100, score));

    return{
        score,
        override: false,
        evidence,
        // confidence: 
        //     score > 85
        //         ? "High"
        //         : score > 50
        //         ? "Medium"
        //         : "Low"
    };
}