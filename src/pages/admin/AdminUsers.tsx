import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Users, Search, Trash2 } from "lucide-react";

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      // Note: auth.users is not accessible via the anon key.
      // We can see user_history and user_likes to identify active users.
      const { data: history } = await supabase
        .from("user_history")
        .select("user_id, title, artist, created_at")
        .order("created_at", { ascending: false })
        .limit(500);

      const userMap = new Map<string, { id: string; plays: number; lastActive: string }>();
      for (const h of history ?? []) {
        if (!userMap.has(h.user_id)) {
          userMap.set(h.user_id, { id: h.user_id, plays: 0, lastActive: h.created_at });
        }
        const u = userMap.get(h.user_id)!;
        u.plays++;
        if (h.created_at > u.lastActive) u.lastActive = h.created_at;
      }

      const userList = Array.from(userMap.values());
      setUsers(userList);
      setLoading(false);
    })();
  }, []);

  const filtered = search ? users.filter((u) => u.id.includes(search)) : users;

  return (
    <div className="animate-fade-in p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink-50">Users</h1>
        <p className="text-sm text-ink-400">{users.length} active users</p>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" size={18} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by user ID…" className="input-field pl-11 font-mono text-xs" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-mint-500 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card flex flex-col items-center p-12 text-center">
          <Users className="mb-3 text-ink-400" size={32} />
          <p className="text-sm text-ink-400">No active users found yet. Users appear here after they listen to music.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((user) => (
            <div key={user.id} className="card flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-mint-500/10 text-mint-500">
                <Users size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-xs text-ink-200">{user.id}</p>
                <p className="text-xs text-ink-400">{user.plays} plays · Last active {new Date(user.lastActive).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 card p-4">
        <p className="text-xs text-ink-400">
          Note: For privacy, user management is limited to viewing activity. Full user account management (including banning or deletion) is handled through the Supabase dashboard under Authentication → Users.
        </p>
      </div>
    </div>
  );
}
