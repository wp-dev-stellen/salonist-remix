-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RetailProduct" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "crmProductId" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "title" TEXT,
    "productType" TEXT,
    "sku" TEXT,
    "salePrice" TEXT,
    "qty" TEXT,
    "shopifyProductId" TEXT,
    "showInApp" BOOLEAN NOT NULL DEFAULT true,
    "rawJson" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_RetailProduct" ("createdAt", "crmProductId", "domainId", "id", "productType", "qty", "rawJson", "salePrice", "shop", "shopifyProductId", "showInApp", "sku", "title", "updatedAt") SELECT "createdAt", "crmProductId", "domainId", "id", "productType", "qty", "rawJson", "salePrice", "shop", "shopifyProductId", "showInApp", "sku", "title", "updatedAt" FROM "RetailProduct";
DROP TABLE "RetailProduct";
ALTER TABLE "new_RetailProduct" RENAME TO "RetailProduct";
CREATE UNIQUE INDEX "RetailProduct_crmProductId_key" ON "RetailProduct"("crmProductId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
