import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Copy, Share2, Trash2, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_authenticated/strategies")({ component: StrategiesPage });

interface Row {
  id: string; name: string; underlying: string; spot: number;
  expiry: string; legs: unknown[]; is_public: boolean; created_at: string;
}

function StrategiesPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.from("strategies")
      .select("id,name,underlying,spot,expiry,legs,is_public,created_at")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data as Row[] | null) ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, [user]);

  async function del(id: string) {
    const { error } = await supabase.from("strategies").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRows((r) => r.filter((x) => x.id !== id));
    toast.success("Deleted");
  }
  async function togglePublic(r: Row) {
    const { error } = await supabase.from("strategies").update({ is_public: !r.is_public }).eq("id", r.id);
    if (error) return toast.error(error.message);
    setRows((rs) => rs.map((x) => x.id === r.id ? { ...x, is_public: !r.is_public } : x));
  }
  async function dup(r: Row) {
    if (!user) return;
    const { data, error } = await supabase.from("strategies").insert({
      user_id: user.id, name: r.name + " (copy)", underlying: r.underlying,
      spot: r.spot, expiry: r.expiry, legs: JSON.parse(JSON.stringify(r.legs)), is_public: false,
    }).select("*").single();
    if (error) return toast.error(error.message);
    setRows((rs) => [data as Row, ...rs]);
    toast.success("Duplicated");
  }

  return (
    <div className="p-4">
      <h1 className="text-lg font-semibold mb-4">Saved strategies</h1>
      {loading ? <div className="text-sm text-muted-foreground">Loading…</div>
      : rows.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface-1 p-10 text-center">
          <div className="text-sm text-muted-foreground">No strategies yet.</div>
          <Link to="/builder" className="mt-3 inline-block text-primary text-sm hover:underline">Open Strategy Builder →</Link>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-surface-1 overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead className="text-xs uppercase tracking-widest text-muted-foreground">
              <tr className="[&>th]:px-4 [&>th]:py-2.5 [&>th]:text-left border-b border-border">
                <th>Name</th><th>Underlying</th><th>Legs</th><th>Expiry</th><th>Created</th><th>Visibility</th><th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="[&>td]:px-4 [&>td]:py-2.5 border-b border-border/40 hover:bg-surface-2/50">
                  <td className="font-medium">{r.name}</td>
                  <td className="mono text-xs">{r.underlying}</td>
                  <td className="mono">{r.legs.length}</td>
                  <td className="mono text-xs">{r.expiry}</td>
                  <td className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td>
                    <button onClick={() => togglePublic(r)}
                      className={"text-xs px-2 py-0.5 rounded " + (r.is_public ? "bg-primary/15 text-primary" : "bg-surface-2 text-muted-foreground")}>
                      {r.is_public ? "Public" : "Private"}
                    </button>
                  </td>
                  <td>
                    <div className="flex gap-1 justify-end">
                      {r.is_public && (
                        <button onClick={async () => { await navigator.clipboard.writeText(`${window.location.origin}/shared/${r.id}`); toast.success("Link copied"); }}
                          className="p-1.5 rounded hover:bg-surface-2 text-muted-foreground" title="Copy share link"><Share2 className="w-3.5 h-3.5" /></button>
                      )}
                      <Link to="/shared/$id" params={{ id: r.id }}
                        className="p-1.5 rounded hover:bg-surface-2 text-muted-foreground" title="Open"><ExternalLink className="w-3.5 h-3.5" /></Link>
                      <button onClick={() => dup(r)} className="p-1.5 rounded hover:bg-surface-2 text-muted-foreground" title="Duplicate"><Copy className="w-3.5 h-3.5" /></button>
                      <button onClick={() => del(r.id)} className="p-1.5 rounded hover:bg-bear/15 text-muted-foreground hover:text-bear" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
