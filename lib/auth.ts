import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type Profile = {
  full_name: string | null;
  phone: string | null;
};

type ProfileLookup = {
  column: "id" | "user_id" | "email";
  value: string;
};

const roleKeys = [
  "role",
  "roles",
  "user_role",
  "account_role",
  "account_type",
  "type",
  "access_level",
  "user_type",
  "membership",
  "permissions",
  "permission",
];

const adminFlagKeys = [
  "admin",
  "is_admin",
  "isAdmin",
  "super_admin",
  "is_super_admin",
];

function parseDelimitedEnvValue(value: unknown): string[] {
  if (typeof value !== "string") return [];

  return value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

// Allow admin access via environment configuration when the profile schema
// does not expose an explicit admin field.
// Example:
// NEXT_PUBLIC_ADMIN_EMAILS=admin@example.com,owner@example.com
// NEXT_PUBLIC_ADMIN_USER_IDS=8c2be22a-229a-404f-992a-b7fbd524b584
function isAdminOverride(user: User) {
  const email = String(user.email || "").toLowerCase();
  const id = String(user.id || "");
  const adminEmails = parseDelimitedEnvValue(
    process.env.NEXT_PUBLIC_ADMIN_EMAILS,
  );
  const adminIds = parseDelimitedEnvValue(
    process.env.NEXT_PUBLIC_ADMIN_USER_IDS,
  );

  return (
    (email && adminEmails.includes(email)) || (id && adminIds.includes(id))
  );
}

export function normalizeRole(role: unknown): string {
  if (typeof role === "boolean") {
    return role ? "admin" : "";
  }

  if (Array.isArray(role)) {
    return role.map(normalizeRole).find(Boolean) || "";
  }

  if (typeof role === "string") {
    return role.trim().toLowerCase();
  }

  return "";
}

export function isAdminRole(role: unknown) {
  return [
    "admin",
    "administrator",
    "owner",
    "super_admin",
    "superadmin",
  ].includes(normalizeRole(role));
}

function getRoleFromRecord(
  record: Record<string, unknown> | null | undefined,
): string {
  if (!record) return "";

  function lookupValue(value: unknown): string {
    if (isAdminRole(value)) {
      return "admin";
    }

    if (typeof value === "string") {
      return normalizeRole(value);
    }

    if (typeof value === "boolean") {
      return normalizeRole(value);
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        const found = lookupValue(item);
        if (found) {
          return found;
        }
      }

      return "";
    }

    if (typeof value === "object" && value !== null) {
      return getRoleFromRecord(value as Record<string, unknown>);
    }

    return "";
  }

  const normalizedKeys = Object.keys(record).reduce<Record<string, string>>(
    (acc, key) => ({ ...acc, [key.toLowerCase()]: key }),
    {},
  );

  for (const key of [...adminFlagKeys, ...roleKeys]) {
    const lookupKey = normalizedKeys[key.toLowerCase()];
    if (!lookupKey) continue;

    const role = lookupValue(record[lookupKey]);
    if (role) {
      return role;
    }
  }

  for (const value of Object.values(record)) {
    if (typeof value === "object" && value !== null) {
      const nestedRole = lookupValue(value);
      if (nestedRole) {
        return nestedRole;
      }
    }
  }

  return "";
}

function shouldIgnoreLookupError(error: { message?: string; code?: string }) {
  return (
    error.code === "PGRST204" ||
    error.message?.toLowerCase().includes("could not find") ||
    error.message?.toLowerCase().includes("does not exist") ||
    false
  );
}

function getProfileLookups(user: User): ProfileLookup[] {
  return [
    { column: "id", value: user.id },
    { column: "user_id", value: user.id },
    ...(user.email ? [{ column: "email" as const, value: user.email }] : []),
  ];
}

async function findProfileRow<T extends Record<string, unknown>>(
  user: User,
  columns: string,
) {
  let lastError: unknown = null;

  for (const lookup of getProfileLookups(user)) {
    const { data, error } = await supabase
      .from("profiles")
      .select(columns)
      .eq(lookup.column, lookup.value)
      .maybeSingle();

    if (error) {
      lastError = error;

      if (shouldIgnoreLookupError(error)) {
        continue;
      }

      throw error;
    }

    if (data) {
      return {
        data: data as unknown as T,
        lookup,
      };
    }
  }

  if (lastError) {
    console.warn("Profile lookup skipped missing columns", lastError);
  }

  return null;
}

export function getMetadataRole(user: User | null) {
  const appMetadata = user?.app_metadata as Record<string, unknown> | undefined;
  const userMetadata = user?.user_metadata as
    | Record<string, unknown>
    | undefined;

  return (
    getRoleFromRecord(appMetadata) ||
    getRoleFromRecord(userMetadata) ||
    normalizeRole(user?.role)
  );
}

function timeoutPromise<T>(
  promise: Promise<T>,
  timeoutMs: number,
  fallback: T,
): Promise<T> {
  let timeoutId = 0;

  return Promise.race([
    promise.finally(() => clearTimeout(timeoutId)),
    new Promise<T>((resolve) => {
      timeoutId = window.setTimeout(() => resolve(fallback), timeoutMs);
    }),
  ]);
}

export async function getBrowserSessionUser() {
  const [
    { data: sessionData, error: sessionError },
    { data: userData, error: userError },
  ] = await Promise.all([supabase.auth.getSession(), supabase.auth.getUser()]);

  if (sessionError && userError) {
    throw sessionError || userError;
  }

  return sessionData?.session?.user ?? userData?.user ?? null;
}

export async function waitForBrowserSessionUser(
  timeoutMs = 5000,
): Promise<User | null> {
  const user = await timeoutPromise(getBrowserSessionUser(), timeoutMs, null);

  if (user) {
    return user;
  }

  return new Promise<User | null>((resolve) => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        subscription.unsubscribe();
        resolve(session.user);
      }
    });

    window.setTimeout(() => {
      subscription.unsubscribe();
      resolve(null);
    }, timeoutMs);
  });
}

export async function getFreshBrowserUser() {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  return data.user;
}

export async function fetchProfile(user: User) {
  const result = await findProfileRow<Profile>(user, "full_name, phone");

  return result?.data ?? null;
}

export async function upsertProfile(user: User, profile: Profile) {
  const existingProfile = await findProfileRow<Profile>(
    user,
    "full_name, phone",
  );
  const lookup = existingProfile?.lookup ?? {
    column: "id" as const,
    value: user.id,
  };

  const payload: Record<string, string | null> = {
    [lookup.column]: lookup.value,
    full_name: profile.full_name,
    phone: profile.phone,
  };

  const { data, error } = existingProfile
    ? await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
        })
        .eq(lookup.column, lookup.value)
        .select("full_name, phone")
        .maybeSingle()
    : await supabase
        .from("profiles")
        .insert(payload)
        .select("full_name, phone")
        .maybeSingle();

  if (error) {
    throw error;
  }

  return data as Profile | null;
}

export async function getUserRole(user: User) {
  const metadataRole = getMetadataRole(user);

  try {
    const profileResult = await findProfileRow<Record<string, unknown>>(
      user,
      "*",
    );
    const profileRole = getRoleFromRecord(profileResult?.data);

    if (
      isAdminRole(profileRole) ||
      isAdminRole(metadataRole) ||
      isAdminOverride(user)
    ) {
      return "admin";
    }

    try {
      const freshUser = await getFreshBrowserUser();
      const freshMetadataRole = getMetadataRole(freshUser);

      if (isAdminRole(freshMetadataRole) || isAdminOverride(freshUser)) {
        return "admin";
      }

      return profileRole || freshMetadataRole || metadataRole;
    } catch (error) {
      console.error("Failed to refresh auth user for role check", error);
      return profileRole || metadataRole;
    }
  } catch (error) {
    if (metadataRole) {
      return metadataRole;
    }

    throw error;
  }
}
