-- CreateEnum
CREATE TYPE "public"."FeedbackType" AS ENUM ('RISK_ALERT', 'COST_ANALYSIS', 'BEHAVIORAL_NUDGE');

-- CreateTable
CREATE TABLE "public"."Feedback" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "public"."FeedbackType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "portafolioId" TEXT NOT NULL,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Feedback_portafolioId_idx" ON "public"."Feedback"("portafolioId");

-- AddForeignKey
ALTER TABLE "public"."Feedback" ADD CONSTRAINT "Feedback_portafolioId_fkey" FOREIGN KEY ("portafolioId") REFERENCES "public"."Portafolio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
