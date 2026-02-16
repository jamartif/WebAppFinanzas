-- AlterTable
ALTER TABLE "investment_balances" ADD COLUMN "accumulated_amount" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- Update existing records to set accumulated_amount = invested_amount (initial migration)
-- This will be recalculated properly by the backend
UPDATE "investment_balances" SET "accumulated_amount" = "invested_amount";
