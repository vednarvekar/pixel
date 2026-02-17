import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, ImageIcon, X, Sparkles, History, LogOut, Cpu } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ScanResults from "@/components/ScanResults";

import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify"; 

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
    // This MUST match upload.single("image") in your backend
    formData.append("image", selectedFile); 

    const response = await fetch(`${API_BASE_URL}/api/images/scan`, {
      method: "POST",
      body: formData,
      // Note: Don't set Content-Type header manually when sending FormData, 
      // the browser does it automatically with the boundary string.
    });

    if (!response.ok) {
      const errorMsg = await response.json();
      throw new Error(errorMsg);
    }

    const data = await response.json();
    
    // This takes the real data from your Node server and puts it in the UI
    setResult(data); 
    setScanState("results");
    toast.success("Analysis successful!");
  } catch (error: any) {
    toast.error("Server Error: Make sure your backend is running on port 3000");
    setScanState("preview");
    console.error("DEBUG: Scan failed", error);
    // This will tell us if it's a CORS error, a 500 error, or a Network error
    toast.error(`Error: ${error.message}`); 
    setScanState("preview");
  }
};

  const handleReset = () => {
    setScanState("idle");
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
  };

  // Auth Middleware
const navigate = useNavigate();
useEffect(() => {
  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login");
    }
  };
  checkUser();
}, [navigate]);


  return (
    <div className="min-h-screen bg-background relative">
      <div className="absolute inset-0 grid-pattern opacity-20" />

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-3 border-b border-border/50 glass-strong">
        <Link to="/" className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          <span className="text-xl font-bold font-display text-foreground">
            Pixel
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild className="border border-white-800">
            <Link to="/history">
              <History className="w-4 h-4 mr-1" /> History
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="border border-white-800"
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

      <main className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        {/* Dropzone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div
            className={`glass rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer ${
              dragActive
                ? "border-primary bg-primary/5 scale-[1.02] glow-border"
                : "border-border/60 hover:border-primary/40"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() =>
              scanState === "idle" && fileInputRef.current?.click()
            }
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
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold font-display mb-2">
                    Drop your image here
                  </h2>
                  <p className="text-muted-foreground text-sm mb-6">
                    or click to browse —  JPG, JPEG, PNG, WEBP supported (Upto - 5MB)
                  </p>
                  <Button variant="outline" size="sm">
                    <ImageIcon className="w-4 h-4 mr-1" /> Browse Files
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="preview"
                  className="relative p-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReset();
                    }}
                    className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center hover:bg-background transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="relative overflow-hidden rounded-xl max-h-[400px] flex items-center justify-center bg-background/30">
                    {previewUrl && (
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="max-h-[400px] object-contain"
                      />
                    )}
                    {/* Scan line animation */}
                    {scanState === "scanning" && (
                      <div className="absolute inset-0">
                        <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan-line shadow-[0_0_15px_hsl(var(--primary)/0.6)]" />
                      </div>
                    )}
                  </div>

                  {scanState === "preview" && (
                    <motion.div
                      className="flex justify-center mt-6"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Button
                        size="lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleScan();
                        }}
                        className="glow-border"
                      >
                        <Cpu className="w-4 h-4 mr-2" /> Analyze Image
                      </Button>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Results area */}
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
    </div>
  );
};


export default Dashboard;
