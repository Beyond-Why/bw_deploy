import { sql } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import {
  boolean,
  customType,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgPolicy,
  pgSchema,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { authenticatedRole, anonRole } from "drizzle-orm/supabase";

/**
 * `auth.users` is managed by Supabase Auth, not this app. Declaring a
 * minimal stub lets `profiles.id` carry a real foreign key reference
 * without Drizzle trying to create/manage the `auth` schema or table.
 */
const authSchema = pgSchema("auth");
export const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey(),
});

/**
 * Case-insensitive text, backed by the `citext` extension. Installed in
 * the `extensions` schema, which is on Supabase's default search_path
 * (`"$user", public, extensions`), so the unqualified type name resolves.
 */
const citext = customType<{ data: string }>({
  dataType() {
    return "citext";
  },
});

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id")
      .primaryKey()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    username: citext("username").notNull().unique(),
    displayName: text("display_name"),
    // Snapshot of auth.users.email, kept in sync by the handle_new_user
    // trigger at signup — lets the sign-in-by-username lookup resolve an
    // email without a service-role admin call (see
    // /api/auth/lookup-username).
    email: text("email"),
    avatarUrl: text("avatar_url"),
    bio: text("bio"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // Anyone (logged out or in) can read public profiles.
    pgPolicy("Profiles are viewable by everyone", {
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`true`,
    }),
    // A signed-in user may update only their own profile row. There is
    // deliberately no insert/delete policy here — profile creation is
    // owned by the `handle_new_user` trigger on `auth.users`
    // (SECURITY DEFINER, bypasses RLS) and deletion happens only via
    // the auth.users foreign key's ON DELETE CASCADE. See
    // drizzle/0001_profiles_trigger.sql for that trigger.
    pgPolicy("Users can update their own profile", {
      for: "update",
      to: authenticatedRole,
      using: sql`auth.uid() = ${table.id}`,
      withCheck: sql`auth.uid() = ${table.id}`,
    }),
  ]
).enableRLS();

export const likes = pgTable(
  "likes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    // Slug of the episode/series/etc — paired with contentType, not a FK
    // (content lives in the filesystem as MDX, not in the database).
    contentId: text("content_id").notNull(),
    contentType: text("content_type").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("likes_user_content_unique").on(
      table.userId,
      table.contentId,
      table.contentType
    ),
    index("likes_content_idx").on(table.contentId, table.contentType),
    // Counts are public; only the owner can create/remove their own like.
    pgPolicy("Likes are viewable by everyone", {
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`true`,
    }),
    pgPolicy("Users can like as themselves", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`auth.uid() = ${table.userId}`,
    }),
    pgPolicy("Users can remove their own like", {
      for: "delete",
      to: authenticatedRole,
      using: sql`auth.uid() = ${table.userId}`,
    }),
  ]
).enableRLS();

export const bookmarks = pgTable(
  "bookmarks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    // Same compound-id convention as `likes.contentId`/`contentType`.
    contentId: text("content_id").notNull(),
    contentType: text("content_type").notNull(),
    // Snapshot metadata, captured at save time — the profile page renders
    // bookmark cards from these columns instead of re-reading MDX files.
    contentTitle: text("content_title").notNull(),
    contentUrl: text("content_url").notNull(),
    seriesTitle: text("series_title"),
    seriesSlug: text("series_slug"),
    episodeNumber: integer("episode_number"),
    thumbnailUrl: text("thumbnail_url"),
    // Series category/subject (e.g. "Foundation & Reality") — separate
    // from seriesTitle so an episode card can show both without repeating
    // the series name twice (accent category tag up top, series name
    // once in the "Episode N · Series" line).
    contentCategory: text("content_category"),
    // Insight collections only — which card the user was on when they
    // bookmarked (or last read to), so the profile's saved-collection
    // carousel can resume there instead of always starting at card 1.
    activeCardIndex: integer("active_card_index").default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("bookmarks_user_content_unique").on(
      table.userId,
      table.contentId,
      table.contentType
    ),
    index("bookmarks_content_idx").on(table.contentId, table.contentType),
    index("bookmarks_user_created_idx").on(table.userId, table.createdAt),
    // Counts are public; only the owner can create/remove their own bookmark.
    pgPolicy("Bookmarks are viewable by everyone", {
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`true`,
    }),
    pgPolicy("Users can bookmark as themselves", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`auth.uid() = ${table.userId}`,
    }),
    pgPolicy("Users can remove their own bookmark", {
      for: "delete",
      to: authenticatedRole,
      using: sql`auth.uid() = ${table.userId}`,
    }),
  ]
).enableRLS();

export const readingProgress = pgTable(
  "reading_progress",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    // Episode slug, e.g. "deep-dives/essence-of-linear-algebra/episode_1" —
    // same compound-id convention as `likes.contentId`.
    contentId: text("content_id").notNull(),
    contentType: text("content_type").notNull(),
    // One level up, e.g. "deep-dives/essence-of-linear-algebra" — lets
    // Continue Reading group/enrich without re-parsing contentId.
    seriesId: text("series_id"),
    scrollPercent: doublePrecision("scroll_percent").notNull().default(0),
    // Sticky — once true, later updates never clear it (re-reads don't
    // un-complete an episode).
    completed: boolean("completed").notNull().default(false),
    lastReadAt: timestamp("last_read_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("reading_progress_user_content_unique").on(
      table.userId,
      table.contentId,
      table.contentType
    ),
    index("reading_progress_user_last_read_idx").on(table.userId, table.lastReadAt),
    // Private to the reader — no anon/public select policy.
    pgPolicy("Users can view their own reading progress", {
      for: "select",
      to: authenticatedRole,
      using: sql`auth.uid() = ${table.userId}`,
    }),
    pgPolicy("Users can insert their own reading progress", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`auth.uid() = ${table.userId}`,
    }),
    pgPolicy("Users can update their own reading progress", {
      for: "update",
      to: authenticatedRole,
      using: sql`auth.uid() = ${table.userId}`,
      withCheck: sql`auth.uid() = ${table.userId}`,
    }),
  ]
).enableRLS();

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    // Snapshot of the author's identity at post time — deliberately not
    // re-derived from `profiles` on read, so a later handle/name/avatar
    // change doesn't rewrite history on old comments.
    userHandle: text("user_handle").notNull(),
    userDisplayName: text("user_display_name").notNull(),
    userAvatarUrl: text("user_avatar_url"),
    // Same compound-id convention as `likes.contentId`/`contentType`:
    // 'deep-dives/{seriesSlug}/{episodeSlug}' for episode comments,
    // 'deep-dives/{seriesSlug}' for hub-level comments.
    contentId: text("content_id").notNull(),
    contentType: text("content_type").notNull(),
    // Always the bare series slug (no "deep-dives/" prefix) — lets the hub
    // page aggregate every comment across its episodes plus its own
    // hub-level thread in a single query.
    seriesId: text("series_id").notNull(),
    // Metadata snapshot for the hub's "Ep N · Title" tag — null for
    // hub-level comments.
    episodeNumber: text("episode_number"),
    episodeTitle: text("episode_title"),
    // Null = top-level comment; set = a one-level-deep reply.
    parentId: uuid("parent_id").references((): AnyPgColumn => comments.id, {
      onDelete: "cascade",
    }),
    body: text("body").notNull(),
    isDeleted: boolean("is_deleted").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("comments_content_idx").on(table.contentId, table.contentType),
    index("comments_series_idx").on(table.seriesId),
    index("comments_parent_idx").on(table.parentId),
    // Comments are public; only the owner can create or soft-delete their own.
    pgPolicy("Comments are viewable by everyone", {
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`true`,
    }),
    pgPolicy("Users can comment as themselves", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`auth.uid() = ${table.userId}`,
    }),
    pgPolicy("Users can soft-delete their own comment", {
      for: "update",
      to: authenticatedRole,
      using: sql`auth.uid() = ${table.userId}`,
      withCheck: sql`auth.uid() = ${table.userId}`,
    }),
  ]
).enableRLS();

export const commentLikes = pgTable(
  "comment_likes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    commentId: uuid("comment_id")
      .notNull()
      .references(() => comments.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("comment_likes_user_comment_unique").on(table.userId, table.commentId),
    index("comment_likes_comment_idx").on(table.commentId),
    // Same shape as `likes` — public counts, owner-only create/remove.
    pgPolicy("Comment likes are viewable by everyone", {
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`true`,
    }),
    pgPolicy("Users can like comments as themselves", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`auth.uid() = ${table.userId}`,
    }),
    pgPolicy("Users can remove their own comment like", {
      for: "delete",
      to: authenticatedRole,
      using: sql`auth.uid() = ${table.userId}`,
    }),
  ]
).enableRLS();

export const notificationType = pgEnum("notification_type", [
  "new_deep_dive",
  "new_episode",
  "new_insight_collection",
  "poll",
]);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    type: notificationType("type").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    contentUrl: text("content_url").notNull(),
    read: boolean("read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("notifications_user_created_idx").on(table.userId, table.createdAt),
    // Private to the recipient — no anon/public select policy. Rows are
    // fanned out server-side (see /api/admin/notifications), which runs
    // through the app's own DB connection rather than the user's Supabase
    // session, so there is deliberately no insert policy here either.
    pgPolicy("Users can view their own notifications", {
      for: "select",
      to: authenticatedRole,
      using: sql`auth.uid() = ${table.userId}`,
    }),
    pgPolicy("Users can mark their own notifications read", {
      for: "update",
      to: authenticatedRole,
      using: sql`auth.uid() = ${table.userId}`,
      withCheck: sql`auth.uid() = ${table.userId}`,
    }),
  ]
).enableRLS();

export interface PollOption {
  id: string;
  label: string;
}

export const polls = pgTable(
  "polls",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    question: text("question").notNull(),
    options: jsonb("options").notNull().$type<PollOption[]>(),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    // Null = no expiry.
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // Readable by any signed-in user; no anon policy (same as notifications).
    pgPolicy("Polls are viewable by authenticated users", {
      for: "select",
      to: authenticatedRole,
      using: sql`true`,
    }),
    // No insert policy — rows are created only via the app's own DB
    // connection from the admin-gated route (see /api/admin/polls),
    // same pattern as `notifications`.
  ]
).enableRLS();

export const pollVotes = pgTable(
  "poll_votes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pollId: uuid("poll_id")
      .notNull()
      .references(() => polls.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    optionId: text("option_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // One vote per user per poll — enforced at the DB level, not just the app.
    uniqueIndex("poll_votes_poll_user_unique").on(table.pollId, table.userId),
    index("poll_votes_poll_idx").on(table.pollId),
    // Vote counts are visible to every signed-in user (for showing results);
    // a user may only ever insert a vote as themselves, and never update
    // or delete it afterward.
    pgPolicy("Votes are viewable by authenticated users", {
      for: "select",
      to: authenticatedRole,
      using: sql`true`,
    }),
    pgPolicy("Users can vote as themselves", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`auth.uid() = ${table.userId}`,
    }),
  ]
).enableRLS();
