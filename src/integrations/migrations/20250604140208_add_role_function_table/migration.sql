-- CreateTable
CREATE TABLE "RoleFunction" (
    "id" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoleFunction_pkey" PRIMARY KEY ("id")
);
