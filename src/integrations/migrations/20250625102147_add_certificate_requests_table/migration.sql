-- CreateEnum
CREATE TYPE "CertificateRequestStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED', 'WAITING_INFO');

-- CreateTable
CREATE TABLE "certificate_requests" (
    "id" TEXT NOT NULL,
    "whatsapp_number" TEXT NOT NULL,
    "requester_name" TEXT,
    "requester_document" TEXT,
    "certificate_type" TEXT NOT NULL,
    "request_data" JSONB,
    "interaction_messages" JSONB,
    "status" "CertificateRequestStatus" NOT NULL DEFAULT 'PENDING',
    "document_generated" TEXT,
    "document_sent" BOOLEAN NOT NULL DEFAULT false,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "completion_reason" TEXT,
    "error_message" TEXT,
    "processed_by_user_id" TEXT,
    "processing_started_at" TIMESTAMP(3),
    "processing_ended_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certificate_requests_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "certificate_requests" ADD CONSTRAINT "certificate_requests_processed_by_user_id_fkey" FOREIGN KEY ("processed_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
