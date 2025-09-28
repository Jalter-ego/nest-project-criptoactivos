/*
  Warnings:

  - Added the required column `price` to the `Active` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Active" ADD COLUMN     "price" DOUBLE PRECISION NOT NULL;
