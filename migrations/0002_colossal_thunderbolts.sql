ALTER TABLE "signature_status" ALTER COLUMN "signed_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "signature_status" ALTER COLUMN "signed_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "sign_id" SET NOT NULL;