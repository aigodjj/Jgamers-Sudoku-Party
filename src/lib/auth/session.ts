import { cookies } from "next/headers";
import { getOrCreateProfile } from "@/lib/services/profileService";

const GUEST_COOKIE = "sp_pid";

/**
 * Reads the guest player id injected by middleware.ts and ensures a profile
 * row exists for it. Every API route that touches player data should call
 * this first. Throws if, for some unexpected reason, no id is present
 * (middleware should always provide one).
 */
export async function requireProfileId(): Promise<string> {
  const store = await cookies();
  const id = store.get(GUEST_COOKIE)?.value;
  if (!id) {
    throw new Error("Missing player session cookie");
  }
  return id;
}

export async function getCurrentProfile() {
  const id = await requireProfileId();
  return getOrCreateProfile(id);
}
