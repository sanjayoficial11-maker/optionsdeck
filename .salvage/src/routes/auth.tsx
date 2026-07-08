import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import { Sigma } from "lucide-react";

export const Route = createFileRoute("/auth")({ component: AuthPage });

function AuthPage() {
  const nav = useNavigate();
  const router = useRouter();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) nav({ to: "/builder", replace: true });
    });
  }, [nav]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in");
      } else {
        const { error } = await supabase.auth.signUp({
          email, password, options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Account created");
      }
      router.navigate({ to: "/builder", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Auth failed");
    } finally { setBusy(false); }
  }

  async function google() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) { toast.error(result.error.message || "Google sign-in failed"); setBusy(false); return; }
    if (result.redirected) return;
    router.navigate({ to: "/builder", replace: true });
  }

  return (
    <div className="min-h-screen grid place-items-center bg-background text-foreground px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-8 h-8 rounded-md bg-primary/15 grid place-items-center">
            <Sigma className="w-4 h-4 text-primary" />
          </div>
          <span className="font-semibold text-lg">OptionsDeck<span className="text-primary">.</span></span>
        </div>
        <div className="rounded-lg border border-border bg-surface-1 p-6">
          <h1 className="text-xl font-semibold">{mode === "in" ? "Sign in" : "Create account"}</h1>
          <p className="text-sm text-muted-foreground mt-1">Save, share and manage your strategies.</p>

          <button
            onClick={google} disabled={busy}
            className="mt-5 w-full flex items-center justify-center gap-2 rounded-md border border-border bg-surface-2 hover:bg-surface-2/80 px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
          >
            <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.5-.2-2.2H12v4.3h5.9c-.3 1.4-1 2.6-2.2 3.4v2.8h3.6c2.1-1.9 3.2-4.8 3.2-8.3z"/><path fill="#34A853" d="M12 23c2.9 0 5.4-1 7.2-2.6l-3.6-2.8c-1 .7-2.3 1.1-3.6 1.1-2.8 0-5.2-1.9-6-4.4H2.3v2.8C4.1 20.5 7.8 23 12 23z"/><path fill="#FBBC05" d="M6 14.3c-.2-.7-.4-1.4-.4-2.3s.1-1.6.4-2.3V6.9H2.3C1.5 8.5 1 10.2 1 12s.5 3.5 1.3 5.1L6 14.3z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3 .5 4.1 1.6l3.1-3.1C17.4 2.1 14.9 1 12 1 7.8 1 4.1 3.5 2.3 6.9L6 9.7c.8-2.5 3.2-4.3 6-4.3z"/></svg>
            Continue with Google
          </button>

          <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-widest text-muted-foreground/60">
            <div className="h-px bg-border flex-1" />or<div className="h-px bg-border flex-1" />
          </div>

          <form onSubmit={submit} className="space-y-3">
            <label className="block">
              <div className="text-xs text-muted-foreground mb-1">Email</div>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md bg-input border border-border px-3 py-2 text-sm outline-none focus:border-primary" />
            </label>
            <label className="block">
              <div className="text-xs text-muted-foreground mb-1">Password</div>
              <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md bg-input border border-border px-3 py-2 text-sm outline-none focus:border-primary" />
            </label>
            <button disabled={busy} className="w-full rounded-md bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50">
              {busy ? "Please wait..." : mode === "in" ? "Sign in" : "Create account"}
            </button>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            {mode === "in" ? "New here?" : "Have an account?"}{" "}
            <button onClick={() => setMode(mode === "in" ? "up" : "in")} className="text-primary hover:underline">
              {mode === "in" ? "Create account" : "Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
