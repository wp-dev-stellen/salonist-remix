-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Plan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "planid" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rawJson" JSONB NOT NULL,
    "shopifyCollectionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Plan" ("createdAt", "domainId", "id", "name", "planid", "rawJson", "shop", "shopifyCollectionId", "updatedAt") SELECT "createdAt", "domainId", "id", "name", "planid", "rawJson", "shop", "shopifyCollectionId", "updatedAt" FROM "Plan";
DROP TABLE "Plan";
ALTER TABLE "new_Plan" RENAME TO "Plan";
CREATE UNIQUE INDEX "Plan_planid_key" ON "Plan"("planid");
CREATE TABLE "new_Service" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "serviceId" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" TEXT NOT NULL,
    "time" TEXT,
    "rawJson" JSONB NOT NULL,
    "shopifyProductId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Service_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan" ("planid") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Service" ("createdAt", "domainId", "id", "name", "planId", "price", "rawJson", "serviceId", "shop", "shopifyProductId", "time", "updatedAt") SELECT "createdAt", "domainId", "id", "name", "planId", "price", "rawJson", "serviceId", "shop", "shopifyProductId", "time", "updatedAt" FROM "Service";
DROP TABLE "Service";
ALTER TABLE "new_Service" RENAME TO "Service";
CREATE UNIQUE INDEX "Service_serviceId_key" ON "Service"("serviceId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
