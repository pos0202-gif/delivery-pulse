-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DeliverySettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "minimumPreparationDays" INTEGER NOT NULL DEFAULT 1,
    "enableMorning" BOOLEAN NOT NULL DEFAULT true,
    "enableAfternoon" BOOLEAN NOT NULL DEFAULT true,
    "enableEvening" BOOLEAN NOT NULL DEFAULT false,
    "morningLabel" TEXT NOT NULL DEFAULT 'Morning',
    "afternoonLabel" TEXT NOT NULL DEFAULT 'Afternoon',
    "eveningLabel" TEXT NOT NULL DEFAULT 'Evening',
    "disableSunday" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_DeliverySettings" ("createdAt", "disableSunday", "enableAfternoon", "enableEvening", "enableMorning", "enabled", "id", "minimumPreparationDays", "shop", "updatedAt") SELECT "createdAt", "disableSunday", "enableAfternoon", "enableEvening", "enableMorning", "enabled", "id", "minimumPreparationDays", "shop", "updatedAt" FROM "DeliverySettings";
DROP TABLE "DeliverySettings";
ALTER TABLE "new_DeliverySettings" RENAME TO "DeliverySettings";
CREATE UNIQUE INDEX "DeliverySettings_shop_key" ON "DeliverySettings"("shop");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
