import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Shield, Upload, Cpu, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  {
    icon: Upload,
    title: "Upload Image",
    description: "Drag & drop or select any image you want to verify.",
  },
  {
    icon: Cpu,
    title: "AI Analysis",
    description: "Our model analyzes pixels, metadata, and web footprint.",
  },
  {
    icon: Shield,
    title: "Get Verdict",
    description: "Receive a detailed score breakdown and AI reasoning.",
  },
];

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 grid-pattern opacity-40" />
      
      {/* Gradient orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-primary/8 blur-[150px]" />

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5">
        <Link to="/" className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          <span className="text-xl font-bold font-display tracking-tight text-foreground">
            Pixel
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link to="/history">Demo</Link>
          </Button>
          <Button asChild className="glow-border">
            <Link to="/login">Get Started</Link>
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-20 pb-32 md:pt-32 md:pb-40">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-8 text-sm text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            AI-Powered Detection
          </div>
        </motion.div>

        <motion.h1
          className="text-4xl sm:text-5xl md:text-7xl font-bold font-display leading-tight max-w-4xl mb-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
        >
          Detect what's{" "}
          <span className="text-primary glow-text">real</span> in a world of
          fakes
        </motion.h1>

        <motion.p
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
        >
          Upload any image and let our AI determine if it's genuine or
          AI-generated. Powered by deep learning, metadata analysis, and reverse
          image search.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
        >
          <Button size="lg" asChild className="text-base glow-border">
            <Link to="/dashboard">
              Start Scanning <ArrowRight className="ml-1 w-4 h-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="text-base">
            <Link to="/history">View Demo</Link>
          </Button>
        </motion.div>
      </section>

      {/* How it works */}
      <section className="relative z-10 px-6 md:px-12 pb-32">
        <motion.h2
          className="text-center text-2xl md:text-3xl font-bold font-display mb-16"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          How it works
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              className="glass rounded-2xl p-8 text-center group hover:border-primary/30 transition-colors"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              whileHover={{ y: -4 }}
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-5 group-hover:bg-primary/20 transition-colors">
                <step.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold font-display mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 px-6 py-8 text-center text-sm text-muted-foreground">
        © 2026 Pixel. AI Image Detection.
      </footer>
    </div>
  );
};

export default LandingPage;
