import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import ScoreGauge from "@/components/ScoreGauge";
import TypewriterText from "@/components/TypewriterText";

interface ScanResult {
  final_score: number;
  verdict: string;
  breakdown: {
    model: number;
    metadata: number;
    web: number;
  };
  reasoning?: string;
}

interface ScanResultsProps {
  isScanning: boolean;
  result: ScanResult | null;
  imageUrl: string | null;
  onScanAgain: () => void;
}

const breakdownLabels = [
  { key: "model" as const, label: "Model Score", desc: "ResNet-18 prediction" },
  { key: "metadata" as const, label: "Metadata Score", desc: "EXIF analysis" },
  { key: "web" as const, label: "Web Score", desc: "Reverse image search" },
];

function getScoreColor(score: number) {
  if (score < 40) return "bg-score-green";
  if (score < 60) return "bg-score-yellow";
  if (score < 75) return "bg-score-orange";
  return "bg-score-red";
}

const ScanResults = ({ isScanning, result, imageUrl, onScanAgain }: ScanResultsProps) => {
  if (isScanning) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Skeleton gauge */}
        <div className="glass rounded-2xl p-8 flex flex-col items-center">
          <Skeleton className="w-40 h-40 rounded-full mb-4" />
          <Skeleton className="w-32 h-6 mb-2" />
          <Skeleton className="w-48 h-4" />
        </div>
        {/* Skeleton breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass rounded-xl p-6">
              <Skeleton className="w-24 h-4 mb-3" />
              <Skeleton className="w-full h-3 rounded-full mb-2" />
              <Skeleton className="w-16 h-3" />
            </div>
          ))}
        </div>
        {/* Skeleton reasoning */}
        <div className="glass rounded-2xl p-6">
          <Skeleton className="w-32 h-5 mb-4" />
          <Skeleton className="w-full h-4 mb-2" />
          <Skeleton className="w-3/4 h-4 mb-2" />
          <Skeleton className="w-5/6 h-4" />
        </div>
      </motion.div>
    );
  }

  if (!result) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Verdict gauge */}
      <div className="glass rounded-2xl p-8 flex flex-col items-center">
        <ScoreGauge score={result.final_score} />
        <motion.h2
          className="text-2xl font-bold font-display mt-6 mb-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {result.verdict}
        </motion.h2>
        <motion.p
          className="text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          {/* Confidence: {result.final_score}% */}
        </motion.p>
      </div>

      {/* Score breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {breakdownLabels.map(({ key, label, desc }, i) => (
          <motion.div
            key={key}
            className="glass rounded-xl p-6"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
          >
            <p className="text-sm font-medium text-foreground mb-1">{label}</p>
            <p className="text-xs text-muted-foreground mb-3">{desc}</p>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${getScoreColor(result.breakdown[key])}`}
                initial={{ width: 0 }}
                animate={{ width: `${result.breakdown[key]}%` }}
                transition={{ delay: 0.6 + i * 0.15, duration: 0.8, ease: "easeOut" }}
              />
            </div>
            <p className="text-right text-xs text-muted-foreground mt-1">
              {result.breakdown[key]}%
            </p>
          </motion.div>
        ))}
      </div>

      {/* AI Reasoning */}
      {result.reasoning && (
        <motion.div
          className="glass rounded-2xl p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <h3 className="text-sm font-semibold font-display text-primary mb-3">
            AI Reasoning
          </h3>
          <TypewriterText text={result.reasoning} delay={1200} />
        </motion.div>
      )}

      {/* Scan again */}
      <motion.div
        className="flex justify-center pt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <Button variant="outline" onClick={onScanAgain}>
          <RotateCcw className="w-4 h-4 mr-2" /> Scan Another Image
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default ScanResults;
