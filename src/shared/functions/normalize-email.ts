export function normalizeEmail<T extends string | null | undefined>(
  email: T,
): T {
  if (typeof email !== "string") {
    return email;
  }
  return email.trim().toLowerCase() as T;
}
