-- CreateTable
CREATE TABLE "recommendation_conversion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "image_id" TEXT NOT NULL,
    "recommendation_score" REAL NOT NULL,
    "impression_at" DATETIME NOT NULL,
    "clicked_at" DATETIME,
    "view_history_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "recommendation_conversion_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "Image" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "recommendation_conversion_view_history_id_fkey" FOREIGN KEY ("view_history_id") REFERENCES "view_history" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "recommendation_conversion_view_history_id_key" ON "recommendation_conversion"("view_history_id");

-- CreateIndex
CREATE INDEX "recommendation_conversion_image_id_idx" ON "recommendation_conversion"("image_id");

-- CreateIndex
CREATE INDEX "recommendation_conversion_impression_at_idx" ON "recommendation_conversion"("impression_at");
