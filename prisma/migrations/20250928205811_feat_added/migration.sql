/*
  Warnings:

  - The primary key for the `Active` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `createdAt` on the `Active` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `Active` table. All the data in the column will be lost.
  - You are about to drop the column `lastUpdate` on the `Active` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Active` table. All the data in the column will be lost.
  - You are about to drop the column `saldo` on the `Portafolio` table. All the data in the column will be lost.
  - You are about to drop the column `activeId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `commission` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Transaction` table. All the data in the column will be lost.
  - Added the required column `activeSymbol` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `Transaction` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "public"."TransactionType" AS ENUM ('BUY', 'SELL');

-- DropForeignKey
ALTER TABLE "public"."Transaction" DROP CONSTRAINT "Transaction_activeId_fkey";

-- AlterTable
ALTER TABLE "public"."Active" DROP CONSTRAINT "Active_pkey",
DROP COLUMN "createdAt",
DROP COLUMN "id",
DROP COLUMN "lastUpdate",
DROP COLUMN "updatedAt",
ADD CONSTRAINT "Active_pkey" PRIMARY KEY ("symbol");

-- AlterTable
ALTER TABLE "public"."Portafolio" DROP COLUMN "saldo",
ADD COLUMN     "cash" DOUBLE PRECISION NOT NULL DEFAULT 10000.00;

-- AlterTable
ALTER TABLE "public"."Transaction" DROP COLUMN "activeId",
DROP COLUMN "commission",
DROP COLUMN "description",
DROP COLUMN "updatedAt",
ADD COLUMN     "activeSymbol" TEXT NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" "public"."TransactionType" NOT NULL;

-- CreateTable
CREATE TABLE "public"."Holding" (
    "id" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "portafolioId" TEXT NOT NULL,
    "activeSymbol" TEXT NOT NULL,

    CONSTRAINT "Holding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Holding_portafolioId_activeSymbol_key" ON "public"."Holding"("portafolioId", "activeSymbol");

-- AddForeignKey
ALTER TABLE "public"."Holding" ADD CONSTRAINT "Holding_portafolioId_fkey" FOREIGN KEY ("portafolioId") REFERENCES "public"."Portafolio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Holding" ADD CONSTRAINT "Holding_activeSymbol_fkey" FOREIGN KEY ("activeSymbol") REFERENCES "public"."Active"("symbol") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_activeSymbol_fkey" FOREIGN KEY ("activeSymbol") REFERENCES "public"."Active"("symbol") ON DELETE RESTRICT ON UPDATE CASCADE;
