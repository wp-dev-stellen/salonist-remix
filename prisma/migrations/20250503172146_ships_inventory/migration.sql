-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ShopChannel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "shipsInventory" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ShopChannel" ("createdAt", "handle", "id", "name", "shop", "updatedAt") SELECT "createdAt", "handle", "id", "name", "shop", "updatedAt" FROM "ShopChannel";
DROP TABLE "ShopChannel";
ALTER TABLE "new_ShopChannel" RENAME TO "ShopChannel";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
