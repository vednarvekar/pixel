import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Chrome, Sparkles, Loader2, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify"; // Import Toast

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const name = user.user_metadata?.full_name || user.user_metadata?.name;
        setUserName(name || "User");
        if (window.location.pathname === "/login") navigate("/dashboard");
      }
    };
    getUser();
  }, [navigate]);

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) toast.error(error.message);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isSignUp) {
      const { error, data } = await supabase.auth.signUp({ 
        email, 
        password,
        options: { data: { full_name: fullName } }
      });
      
      if (error) {
        toast.error(error.message);
      } else if (data.user && data.session === null) {
        // This happens if email confirmation is turned ON in Supabase
        toast.info("Check your email for a confirmation link!");
      } else {
        toast.success("Welcome to Pixel!");
        navigate("/dashboard");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error(error.message);
      else {
        toast.success("Logged in successfully!");
        navigate("/dashboard");
      }
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserName(null);
    toast.info("Logged out");
    navigate("/login");
  };

  useEffect(() => {
  // This triggers as soon as the email link is clicked and the user hits your site
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_IN" && session) {
      toast.success("Identity verified! Welcome to Pixel.");
      navigate("/dashboard");
    }
  });

  return () => subscription.unsubscribe();
}, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex flex-col text-white">
      <nav className="flex items-center justify-between px-6 md:px-12 py-4 border-b border-slate-800/50">
        <Link to="/" className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          <span className="text-xl font-bold text-white tracking-tight">Pixel</span>
        </Link>
        <div className="flex items-center gap-4">
          {userName && <span className="text-sm text-slate-400 font-medium">Hi, {userName}</span>}
          <Button asChild className="text-black font-bold glow-border">
            <Link to="/">Home</Link>
          </Button>
          {userName && (
            <Button variant="destructive" size="sm" onClick={handleLogout} className="flex gap-2">
              <LogOut className="w-4 h-4" /> Logout
            </Button>
          )}
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-slate-800 bg-slate-900/50 backdrop-blur-xl text-white">
          <CardHeader className="space-y-1 text-center border-b border-slate-800/50 mb-6">
            <CardTitle className="text-3xl font-bold tracking-tight pb-1">
              {isSignUp ? "Create an account" : "Welcome back"}
            </CardTitle>
            <CardDescription className="text-slate-400 pb-2">
              {isSignUp ? "Join the precision detection network" : "Enter your credentials to access your dashboard"}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Button variant="outline" onClick={handleGoogleLogin} className="w-full h-11 bg-white text-black hover:bg-slate-200 border-none font-semibold flex gap-2">
              <Chrome className="w-5 h-5" />
              Continue with Google
            </Button>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-800"></span></div>
              <div className="relative flex justify-center text-xs uppercase text-slate-500">
                <span className="bg-[#0b0f1a] px-2">Or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleAuth} className="grid gap-4">
              {isSignUp && (
                <div className="grid gap-2 text-left">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" placeholder="John Doe" required 
                    className="bg-slate-950 border-slate-800 text-white focus:ring-primary"
                    value={fullName} onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              )}

              <div className="grid gap-2 text-left">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" type="email" placeholder="name@example.com" required 
                  className="bg-slate-950 border-slate-800 text-white"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2 text-left">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" type="password" required 
                  className="bg-slate-950 border-slate-800 text-white"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full glow-border mt-2 bg-primary hover:bg-primary/90">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSignUp ? "Sign Up" : "Login"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <div className="text-sm text-slate-400 text-center w-full">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button 
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-primary hover:underline underline-offset-4"
              >
                {isSignUp ? "Login" : "Sign Up"}
              </button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}