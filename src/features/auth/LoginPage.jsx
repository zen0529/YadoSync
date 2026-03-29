import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "./context/AuthContext";

export const LoginPage = () => {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    if (isSignUp) {
      const { error } = await signUp(email, password, username);
      if (error) {
        setError(error.message);
      } else {
        setMessage("Account created! Check your email to confirm, then sign in.");
        setIsSignUp(false);
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message);
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#e8e8e8] font-sans">
      <Card className="w-full max-w-sm border border-black/5 shadow-sm">
        <CardHeader className="text-center pb-2">
          <p className="text-2xl font-extrabold text-green-600 tracking-wide mb-1">RESORTSYNC</p>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {isSignUp ? "Create your account" : "Sign in to your account"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {isSignUp && (
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="h-9 rounded-md border border-black/10 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
              />
            )}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-9 rounded-md border border-black/10 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="h-9 rounded-md border border-black/10 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
            />

            {error && <p className="text-xs text-red-600">{error}</p>}
            {message && <p className="text-xs text-green-600">{message}</p>}

            <Button
              type="submit"
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white text-sm h-9 mt-1"
            >
              {loading ? "Please wait..." : isSignUp ? "Sign Up" : "Sign In"}
            </Button>
          </form>

          <p className="text-xs text-center text-muted-foreground mt-4">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); setError(""); setMessage(""); }}
              className="text-green-600 font-semibold hover:underline"
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
