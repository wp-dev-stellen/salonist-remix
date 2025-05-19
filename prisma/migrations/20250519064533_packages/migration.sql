/*
  Warnings:

  - You are about to drop the column `salePrice` on the `Packages` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Packages" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "crmProductId" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "title" TEXT,
    "productType" TEXT,
    "sku" TEXT,
    "price" TEXT,
    "shopifyProductId" TEXT,
    "showInApp" BOOLEAN NOT NULL DEFAULT true,
    "rawJson" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Packages" ("createdAt", "crmProductId", "domainId", "id", "productType", "rawJson", "shop", "shopifyProductId", "showInApp", "sku", "title", "updatedAt") SELECT "createdAt", "crmProductId", "domainId", "id", "productType", "rawJson", "shop", "shopifyProductId", "showInApp", "sku", "title", "updatedAt" FROM "Packages";
DROP TABLE "Packages";
ALTER TABLE "new_Packages" RENAME TO "Packages";
CREATE UNIQUE INDEX "Packages_crmProductId_key" ON "Packages"("crmProductId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
