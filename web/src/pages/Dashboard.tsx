import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, ImageIcon, X, Sparkles, History, LogOut, Cpu } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ScanResults from "@/components/ScanResults";

import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify"; 
import { Github, Linkedin, Twitter, Mail } from 'lucide-react';

const API_BASE_URL = "http://localhost:3000";

type ScanState = "idle" | "preview" | "scanning" | "results";

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

const Dashboard = () => {
  const socials = [
    { icon: Github, href: 'https://github.com/vednarvekar', label: 'GitHub' },
    { icon: Linkedin, href: 'https://www.linkedin.com/in/ved-narvekar/', label: 'LinkedIn' },
    { icon: Twitter, href: 'https://x.com/VedNarvekar', label: 'Twitter' },
    { icon: Mail, href: 'mailto:ved.v.narvekar@gmail.com', label: 'Gmail' },
  ];

  const [scanState, setScanState] = useState<ScanState>("idle");
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setScanState("preview");
    setResult(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleScan = async () => {
    if (!selectedFile) return;
    setScanState("scanning");

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);

      const response = await fetch(`${API_BASE_URL}/api/images/scan`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorMsg = await response.json();
        throw new Error(errorMsg);
      }

      const data = await response.json();
      setResult(data);
      setScanState("results");
      toast.success("Analysis successful!");
    } catch (error: any) {
      toast.error("Server Error: Make sure backend is running on port 3000");
      setScanState("preview");
      console.error("DEBUG: Scan failed", error);
      toast.error(`Error: ${error.message}`);
    }
  };

  const handleReset = () => {
    setScanState("idle");
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const navigate = useNavigate();
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) navigate("/login");
    };
    checkUser();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      <div className="absolute inset-0 grid-pattern opacity-20 pointer-events-none" />

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-3 border-b border-border/50 glass-strong">
        <Link to="/" className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          <span className="text-xl font-bold font-display text-foreground">
            Pixel
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/history">
              <History className="w-4 h-4 mr-1" /> History
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={async () => {
              await supabase.auth.signOut();
              toast.info("Logged out safely");
              navigate("/login");
            }}
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </nav>

      {/* Main grows properly */}
      <main className="relative z-10 flex-1 max-w-4xl mx-auto w-full px-6 py-12">

        {/* Dropzone */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div
            className={`glass rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer ${
              dragActive
                ? "border-primary bg-primary/5 scale-[1.02]"
                : "border-border/60 hover:border-primary/40"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => scanState === "idle" && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />

            <AnimatePresence mode="wait">
              {scanState === "idle" ? (
                <motion.div
                  key="idle"
                  className="flex flex-col items-center justify-center py-20 px-8"
                >
                  <Upload className="w-10 h-10 text-primary mb-4" />
                  <h2 className="text-xl font-semibold mb-2">
                    Drop your image here
                  </h2>
                  <p className="text-muted-foreground text-sm mb-6">
                    or click to browse — JPG, PNG, WEBP (Max 5MB)
                  </p>
                  <Button variant="outline" size="sm">
                    <ImageIcon className="w-4 h-4 mr-1" /> Browse Files
                  </Button>
                </motion.div>
              ) : (
                <motion.div key="preview" className="relative p-6">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReset();
                    }}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="relative rounded-xl max-h-[400px] flex items-center justify-center bg-background/30">
                    {previewUrl && (
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="max-h-[400px] object-contain"
                      />
                    )}
                  </div>

                  {scanState === "preview" && (
                    <div className="flex justify-center mt-6">
                      <Button size="lg" onClick={(e) => {
                        e.stopPropagation();
                        handleScan();
                      }}>
                        <Cpu className="w-4 h-4 mr-2" /> Analyze Image
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Results */}
        <div ref={resultsRef} className="mt-12">
          <AnimatePresence>
            {(scanState === "scanning" || scanState === "results") && (
              <ScanResults
                isScanning={scanState === "scanning"}
                result={result}
                imageUrl={previewUrl}
                onScanAgain={handleReset}
              />
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer now stable */}
      <footer className="border-t border-border py-6 mt-auto">
        <div className="max-w-4xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          
          <div>
            © Ved Narvekar ·{" "}
            <a
              href="https://vednarvekar.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-500 hover:drop-shadow-[0_0_6px_rgba(59,130,246,0.8)] transition-all duration-300"
            >
              vednarvekar.com
            </a>
          </div>

          <div className="flex gap-4">
            {socials.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-500 hover:drop-shadow-[0_0_6px_rgba(59,130,246,0.8)] transition-all duration-300"
              >
                <social.icon size={20} />
              </a>
            ))}
          </div>

          <div>Built with ❤️ & ☕</div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
