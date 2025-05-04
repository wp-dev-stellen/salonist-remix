/*
  Warnings:

  - You are about to drop the column `shipsInventory` on the `ShopChannel` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ShopChannel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ShopChannel" ("createdAt", "handle", "id", "name", "shop", "updatedAt") SELECT "createdAt", "handle", "id", "name", "shop", "updatedAt" FROM "ShopChannel";
DROP TABLE "ShopChannel";
ALTER TABLE "new_ShopChannel" RENAME TO "ShopChannel";
CREATE TABLE "new_ShopLocations" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "locationid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shipsInventory" BOOLEAN NOT NULL DEFAULT false,
    "status" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ShopLocations" ("createdAt", "id", "locationid", "name", "shop", "status", "updatedAt") SELECT "createdAt", "id", "locationid", "name", "shop", "status", "updatedAt" FROM "ShopLocations";
DROP TABLE "ShopLocations";
ALTER TABLE "new_ShopLocations" RENAME TO "ShopLocations";
CREATE UNIQUE INDEX "ShopLocations_locationid_key" ON "ShopLocations"("locationid");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
