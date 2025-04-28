-- CreateTable
CREATE TABLE "RetailProduct" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "crmProductId" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "title" TEXT,
    "productType" TEXT,
    "sku" TEXT,
    "salePrice" REAL,
    "qty" INTEGER,
    "shopifyProductId" TEXT,
    "showInApp" BOOLEAN NOT NULL DEFAULT true,
    "rawJson" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
