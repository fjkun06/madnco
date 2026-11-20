import { isAdmin } from "@/lib/auth/admin";
import { adminSecrets } from "@/lib/auth/session";
import { redisConfigured } from "@/lib/stream/redis";
import { loadState } from "@/lib/stream/store";
import { en } from "@/locales/en";
import { LoginForm } from "../LoginForm";
import { RemotePanel } from "./RemotePanel";

/** Login form, or the Remote with the saved state. Runs per request. */
export async function RemoteGate() {
  if (!adminSecrets()) {
    return (
      <p className="label-mono text-sm text-live">{en.admin.errors["not-configured"]}</p>
    );
  }
  if (!(await isAdmin())) return <LoginForm />;
  return <RemotePanel initial={await loadState()} storageReady={redisConfigured()} />;
}
