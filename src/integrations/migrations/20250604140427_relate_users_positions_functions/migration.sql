/*
  Warnings:

  - You are about to drop the column `position` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "position",
ADD COLUMN     "positionId" TEXT;

-- CreateTable
CREATE TABLE "PositionFunction" (
    "id" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,
    "roleFunctionId" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PositionFunction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PositionFunction_positionId_roleFunctionId_key" ON "PositionFunction"("positionId", "roleFunctionId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionFunction" ADD CONSTRAINT "PositionFunction_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionFunction" ADD CONSTRAINT "PositionFunction_roleFunctionId_fkey" FOREIGN KEY ("roleFunctionId") REFERENCES "RoleFunction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
