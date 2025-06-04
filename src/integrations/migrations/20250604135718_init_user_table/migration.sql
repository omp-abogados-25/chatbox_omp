-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "identification_number" TEXT NOT NULL,
    "issuing_place" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "entry_date" TEXT NOT NULL,
    "salary" TEXT NOT NULL,
    "transportation_allowance" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_identification_number_key" ON "User"("identification_number");
