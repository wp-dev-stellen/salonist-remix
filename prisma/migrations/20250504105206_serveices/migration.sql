-- CreateTable
CREATE TABLE "Plan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "planid" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shopifyCollectionId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Service" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "serviceId" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "shopifyProductId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Service_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan" ("planid") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Plan_planid_key" ON "Plan"("planid");

-- CreateIndex
CREATE UNIQUE INDEX "Service_serviceId_key" ON "Service"("serviceId");
