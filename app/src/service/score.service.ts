interface FusionInput {
    modelScore: number;
    metaScore: number; 
    webScore: number;
    override: boolean;
}

export function fuseScores(input: FusionInput) {
    const { modelScore, metaScore, webScore, override } = input;

    if (override == true) {
        return {
            finalScore: 100, // Change from 1.0 to 100
            verdict: "Definite AI (C2PA Verified)"
        }
    }

    // Weights are fine, but let's calculate a raw decimal first
    let modelWeight = 0.55;
    let metaWeight = 0.30;
    let webWeight = 0.15;

    const rawScore = (modelScore * modelWeight) + (metaScore * metaWeight) + (webScore * webWeight);
    
    // Convert to 0-100 integer for the Gauge
    const finalScore = Math.round(rawScore);

    // Better Verdicts: Map the numbers to human emotions
    let verdict = "Real Image"; // 0-20
    if (finalScore > 85) verdict = "High Probability AI";
    else if (finalScore > 50) verdict = "Suspicious / Likely AI";
    else if (finalScore > 20) verdict = "Likely Real";

    return {
        finalScore,
        verdict,
        // override: false
    };
}