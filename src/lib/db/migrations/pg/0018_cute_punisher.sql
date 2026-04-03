CREATE TABLE "prompt_category" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" text NOT NULL,
	"icon" text NOT NULL,
	"sequence" integer NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prompt_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"label" text NOT NULL,
	"prompt" text NOT NULL,
	"sequence" integer NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "prompt_item" ADD CONSTRAINT "prompt_item_category_id_prompt_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."prompt_category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "prompt_category_sequence_idx" ON "prompt_category" USING btree ("sequence");--> statement-breakpoint
CREATE INDEX "prompt_item_category_id_idx" ON "prompt_item" USING btree ("category_id");