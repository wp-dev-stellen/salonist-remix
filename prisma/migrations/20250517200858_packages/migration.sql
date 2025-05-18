-- CreateTable
CREATE TABLE "Packages" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "crmProductId" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "title" TEXT,
    "productType" TEXT,
    "sku" TEXT,
    "salePrice" TEXT,
    "shopifyProductId" TEXT,
    "showInApp" BOOLEAN NOT NULL DEFAULT true,
    "rawJson" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Packages_crmProductId_key" ON "Packages"("crmProductId");
