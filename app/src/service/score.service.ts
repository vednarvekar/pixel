interface FusionInput {
    modelScore: number;
    metaScore: number; 
    webScore: number;
    override?: boolean;
}

export function fuseScores(input: FusionInput) {
    const {modelScore, metaScore, webScore, override} = input;

    if(override){
        return {
            finalScore: 1.0,
            verdict: "Definite AI (C2PA Verified)"
        }
    }


    let modelWeight = 0.55;
    let metaWeight = 0.30;
    let webWeight = 0.15;

    if(metaScore > 0.7){
        metaWeight = 0.4;
        modelWeight = 0.45;
    }

    if (webScore > 0.8) {
        webWeight = 0.25;
        modelWeight = 0.5;
        metaWeight = 0.25;
    }

    const finalScore =
        modelScore * modelWeight +
        metaScore * metaWeight +
        webScore * webWeight;

    let verdict = "Likely Real";

    if (finalScore > 0.85) verdict = "High Probability AI";
    else if (finalScore > 0.6) verdict = "Suspicious / Likely AI";

    return {
        finalScore,
        verdict
    };

}