-- AlterTable
ALTER TABLE "User" ADD COLUMN     "can_login" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "password" TEXT;
