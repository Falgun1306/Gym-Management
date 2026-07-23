-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "TrainerApplication" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "specialization" "TrainerSpecialization" NOT NULL,
    "experience" INTEGER,
    "bio" TEXT,
    "certifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "coverNote" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainerApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrainerApplication_userId_idx" ON "TrainerApplication"("userId");

-- CreateIndex
CREATE INDEX "TrainerApplication_status_idx" ON "TrainerApplication"("status");

-- CreateIndex
CREATE INDEX "TrainerApplication_createdAt_idx" ON "TrainerApplication"("createdAt");

-- AddForeignKey
ALTER TABLE "TrainerApplication" ADD CONSTRAINT "TrainerApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
