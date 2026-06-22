-- CreateTable
CREATE TABLE "DeliverySettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "minimumPreparationDays" INTEGER NOT NULL DEFAULT 1,
    "enableMorning" BOOLEAN NOT NULL DEFAULT true,
    "enableAfternoon" BOOLEAN NOT NULL DEFAULT true,
    "enableEvening" BOOLEAN NOT NULL DEFAULT false,
    "disableSunday" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "DeliverySettings_shop_key" ON "DeliverySettings"("shop");
