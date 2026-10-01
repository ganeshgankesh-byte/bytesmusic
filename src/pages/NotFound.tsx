import { Link } from "react-router-dom";
import { Music2 } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-base-900 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-mint-500/10">
        <Music2 className="text-mint-500" size={32} />
      </div>
      <h1 className="mt-6 text-4xl font-bold text-ink-50">404</h1>
      <p className="mt-2 text-sm text-ink-400">This page doesn't exist on BytesMusic.</p>
      <Link to="/" className="mt-6 btn-primary">Back to home</Link>
    </div>
  );
}
