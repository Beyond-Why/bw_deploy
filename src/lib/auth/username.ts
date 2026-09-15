// 3–30 chars, lowercase letters/digits/._- , must start and end alnum —
// matches the citext unique constraint and the handle_new_user trigger's
// own sanitization (see drizzle/0011_update_handle_new_user_trigger.sql).
// Shared by the signup form, /api/auth/check-username, and
// /api/profile so all three agree on what a valid username looks like.
export const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9._-]{1,28}[a-z0-9])?$/;

export function isValidUsername(username: string): boolean {
  return USERNAME_PATTERN.test(username);
}
