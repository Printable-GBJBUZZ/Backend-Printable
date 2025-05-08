ALTER TABLE "signature_status" ALTER COLUMN "signed_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "signature_status" ALTER COLUMN "signed_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "files" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "signature_requests" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "signature_status" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "files" DROP COLUMN "expiresAt";