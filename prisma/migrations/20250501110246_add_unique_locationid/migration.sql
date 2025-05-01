/*
  Warnings:

  - A unique constraint covering the columns `[locationid]` on the table `ShopLocations` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ShopLocations_locationid_key" ON "ShopLocations"("locationid");
