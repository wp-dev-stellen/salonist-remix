-- CreateTable
CREATE TABLE "CrmCredential" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientId" TEXT,
    "clientSecret" TEXT,
    "loginStatus" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "CrmCredential_shop_key" ON "CrmCredential"("shop");
