ALTER TABLE "profiles" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;