-- CreateTable
CREATE TABLE "session_traces" (
    "id" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "document_number" TEXT,
    "user_id" TEXT,
    "certificate_request_id" TEXT,
    "step_description" TEXT NOT NULL,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_traces_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "session_traces_phone_number_idx" ON "session_traces"("phone_number");

-- CreateIndex
CREATE INDEX "session_traces_session_id_idx" ON "session_traces"("session_id");

-- CreateIndex
CREATE INDEX "session_traces_status_idx" ON "session_traces"("status");

-- CreateIndex
CREATE INDEX "session_traces_certificate_request_id_idx" ON "session_traces"("certificate_request_id");

-- CreateIndex
CREATE INDEX "session_traces_created_at_idx" ON "session_traces"("created_at");

-- AddForeignKey
ALTER TABLE "session_traces" ADD CONSTRAINT "session_traces_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_traces" ADD CONSTRAINT "session_traces_certificate_request_id_fkey" FOREIGN KEY ("certificate_request_id") REFERENCES "certificate_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE; 