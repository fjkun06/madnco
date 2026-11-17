import { isAdmin } from "@/lib/auth/admin";
import { adminSecrets } from "@/lib/auth/session";
import { redisConfigured } from "@/lib/stream/redis";
import { loadState } from "@/lib/stream/store";
import { en } from "@/locales/en";
import { AdminPanel } from "./AdminPanel";
import { LoginForm } from "./LoginForm";

/** Login form, or the panel with the saved state. Runs per request. */
export async function AdminGate() {
  if (!adminSecrets()) {
    return (
      <p className="label-mono text-sm text-live">{en.admin.errors["not-configured"]}</p>
    );
  }
  if (!(await isAdmin())) return <LoginForm />;
  return (
    <AdminPanel
      initial={await loadState()}
      storageReady={redisConfigured()}
      twitchReady={Boolean(
        process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET,
      )}
    />
  );
}
