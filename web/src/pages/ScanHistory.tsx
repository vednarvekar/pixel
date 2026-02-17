import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Sparkles, History, ArrowLeft, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";

// Demo data for now — will be replaced with Supabase queries
const demoScans = [
  { id: "1", date: "2026-02-15", score: 23, verdict: "Likely Real", thumbnail: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=200&h=200&fit=crop" },
  { id: "2", date: "2026-02-14", score: 73, verdict: "Likely AI Generated", thumbnail: "https://images.unsplash.com/photo-1511300636408-a63a89df3482?w=200&h=200&fit=crop" },
  { id: "3", date: "2026-02-13", score: 91, verdict: "AI Generated", thumbnail: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=200&h=200&fit=crop" },
  { id: "4", date: "2026-02-12", score: 48, verdict: "Uncertain", thumbnail: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=200&h=200&fit=crop" },
];

function getScoreColor(score: number) {
  if (score < 40) return "text-score-green border-score-green/30 bg-score-green/10";
  if (score < 60) return "text-score-yellow border-score-yellow/30 bg-score-yellow/10";
  if (score < 75) return "text-score-orange border-score-orange/30 bg-score-orange/10";
  return "text-score-red border-score-red/30 bg-score-red/10";
}

const ScanHistory = () => {
  const scans = demoScans; // Replace with real data later

  return (
    <div className="min-h-screen bg-background relative">
      <div className="absolute inset-0 grid-pattern opacity-20" />

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-4 border-b border-border/50 glass-strong">
        <Link to="/" className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="text-lg font-bold font-display text-foreground">Pixel</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-1" /> Home
            </Link>
          </Button>
        </div>
      </nav>

      <main className="relative z-10 max-w-5xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-3xl font-bold font-display flex items-center gap-3">
            <History className="w-7 h-7 text-primary" /> Scan History
          </h1>
          <p className="text-muted-foreground mt-2">Your past image analysis results.</p>
        </motion.div>

        {scans.length === 0 ? (
          <motion.div
            className="glass rounded-2xl p-16 flex flex-col items-center text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <ImageOff className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No scans yet</h3>
            <p className="text-sm text-muted-foreground mb-6">Upload your first image to get started.</p>
            <Button asChild>
              <Link to="/dashboard">Go to Dashboard</Link>
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {scans.map((scan, i) => (
              <motion.div
                key={scan.id}
                className="glass rounded-xl overflow-hidden group hover:border-primary/30 transition-all cursor-pointer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -3 }}
              >
                <div className="aspect-video bg-secondary/30 overflow-hidden">
                  <img
                    src={scan.thumbnail}
                    alt="Scan"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">{scan.date}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${getScoreColor(scan.score)}`}>
                      {scan.score}%
                    </span>
                  </div>
                  <p className="text-sm font-medium">{scan.verdict}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ScanHistory;
