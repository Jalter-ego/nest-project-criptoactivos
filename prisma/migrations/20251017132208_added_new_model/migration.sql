-- CreateTable
CREATE TABLE "public"."PortafolioSnapshot" (
    "id" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "portafolioId" TEXT NOT NULL,

    CONSTRAINT "PortafolioSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PortafolioSnapshot_portafolioId_timestamp_idx" ON "public"."PortafolioSnapshot"("portafolioId", "timestamp");

-- AddForeignKey
ALTER TABLE "public"."PortafolioSnapshot" ADD CONSTRAINT "PortafolioSnapshot_portafolioId_fkey" FOREIGN KEY ("portafolioId") REFERENCES "public"."Portafolio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
