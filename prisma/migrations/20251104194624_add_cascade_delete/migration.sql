-- DropForeignKey
ALTER TABLE "public"."Feedback" DROP CONSTRAINT "Feedback_portafolioId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Holding" DROP CONSTRAINT "Holding_portafolioId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PortafolioSnapshot" DROP CONSTRAINT "PortafolioSnapshot_portafolioId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Transaction" DROP CONSTRAINT "Transaction_portafolioId_fkey";

-- AddForeignKey
ALTER TABLE "public"."PortafolioSnapshot" ADD CONSTRAINT "PortafolioSnapshot_portafolioId_fkey" FOREIGN KEY ("portafolioId") REFERENCES "public"."Portafolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Feedback" ADD CONSTRAINT "Feedback_portafolioId_fkey" FOREIGN KEY ("portafolioId") REFERENCES "public"."Portafolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Holding" ADD CONSTRAINT "Holding_portafolioId_fkey" FOREIGN KEY ("portafolioId") REFERENCES "public"."Portafolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_portafolioId_fkey" FOREIGN KEY ("portafolioId") REFERENCES "public"."Portafolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
