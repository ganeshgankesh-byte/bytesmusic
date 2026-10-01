import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Music2, Mail, Lock, ArrowRight } from "lucide-react";

export default function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await signUp(email, password);
    setLoading(false);
    if (error) {
      setError(error);
    } else {
      navigate("/");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-base-900 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-mint-500/10">
              <Music2 className="text-mint-500" size={28} />
            </div>
          </Link>
          <h1 className="mt-4 font-mono text-2xl font-bold text-ink-50">
            Bytes<span className="text-mint-500">Music</span>
          </h1>
          <p className="mt-1 text-sm text-ink-400">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4 p-6">
          {error && (
            <div className="rounded-lg border border-danger-500/30 bg-danger-500/5 px-4 py-3 text-sm text-danger-500">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-200">Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input-field pl-11"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-200">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="input-field pl-11"
                required
                minLength={6}
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Creating account…" : "Create account"}
            {!loading && <ArrowRight size={16} />}
          </button>

          <p className="text-center text-sm text-ink-400">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-mint-500 hover:text-mint-400">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
