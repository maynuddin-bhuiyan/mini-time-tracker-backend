/*
  Warnings:

  - The `checkIn` column on the `Attendance` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `checkOut` column on the `Attendance` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[userId,date]` on the table `Attendance` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "LeaveType" ADD VALUE 'CASUAL';
ALTER TYPE "LeaveType" ADD VALUE 'UNPAID';

-- DropIndex
DROP INDEX "Attendance_userId_date_idx";

-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "isAutoClockOut" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "workedMinutes" INTEGER,
DROP COLUMN "checkIn",
ADD COLUMN     "checkIn" TIMESTAMP(3),
DROP COLUMN "checkOut",
ADD COLUMN     "checkOut" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_userId_date_key" ON "Attendance"("userId", "date");
