-- CreateTable
CREATE TABLE "image_attribute" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "image_id" TEXT NOT NULL,
    "label_id" TEXT NOT NULL,
    "keywords" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "image_attribute_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "Image" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "image_attribute_label_id_fkey" FOREIGN KEY ("label_id") REFERENCES "AttributeLabel" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "image_attribute_image_id_label_id_key" ON "image_attribute"("image_id", "label_id");
