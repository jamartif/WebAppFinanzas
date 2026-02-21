-- CreateEnum
CREATE TYPE "InvestmentType" AS ENUM ('FUND', 'STOCK', 'COMMODITY', 'CROWDFUNDING');

-- CreateTable
CREATE TABLE "banks" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "banks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investment_categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" "InvestmentType" NOT NULL,
    "description" TEXT,
    CONSTRAINT "investment_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_snapshots" (
    "id" SERIAL NOT NULL,
    "month" DATE NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "monthly_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_balances" (
    "id" SERIAL NOT NULL,
    "snapshot_id" INTEGER NOT NULL,
    "bank_id" INTEGER NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL,
    CONSTRAINT "bank_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investment_balances" (
    "id" SERIAL NOT NULL,
    "snapshot_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,
    "invested_amount" DECIMAL(12,2) NOT NULL,
    "current_value" DECIMAL(12,2) NOT NULL,
    CONSTRAINT "investment_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "passive_income" (
    "id" SERIAL NOT NULL,
    "snapshot_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "source" VARCHAR NOT NULL,
    "description" TEXT,
    CONSTRAINT "passive_income_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "monthly_snapshots_month_key" ON "monthly_snapshots"("month");

-- CreateIndex
CREATE UNIQUE INDEX "bank_balances_snapshot_id_bank_id_key" ON "bank_balances"("snapshot_id", "bank_id");

-- CreateIndex
CREATE UNIQUE INDEX "investment_balances_snapshot_id_category_id_key" ON "investment_balances"("snapshot_id", "category_id");

-- AddForeignKey
ALTER TABLE "bank_balances" ADD CONSTRAINT "bank_balances_snapshot_id_fkey" FOREIGN KEY ("snapshot_id") REFERENCES "monthly_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_balances" ADD CONSTRAINT "bank_balances_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "banks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investment_balances" ADD CONSTRAINT "investment_balances_snapshot_id_fkey" FOREIGN KEY ("snapshot_id") REFERENCES "monthly_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investment_balances" ADD CONSTRAINT "investment_balances_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "investment_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passive_income" ADD CONSTRAINT "passive_income_snapshot_id_fkey" FOREIGN KEY ("snapshot_id") REFERENCES "monthly_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passive_income" ADD CONSTRAINT "passive_income_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "investment_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
