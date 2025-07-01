-- AlterTable
ALTER TABLE "certificate_requests" ADD COLUMN     "requester_user_id" TEXT;

-- AddForeignKey
ALTER TABLE "certificate_requests" ADD CONSTRAINT "certificate_requests_requester_user_id_fkey" FOREIGN KEY ("requester_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
