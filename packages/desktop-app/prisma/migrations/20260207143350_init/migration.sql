-- CreateTable
CREATE TABLE "Image" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "path" TEXT NOT NULL,
    "thumbnail_path" TEXT,
    "mime_type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "title" TEXT NOT NULL DEFAULT '無題の画像',
    "description" TEXT,
    "embedding" BLOB,
    "embedded_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AttributeLabel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "embedding" BLOB,
    "embedded_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

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

-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "cover_image_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "collection_image" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "collection_id" TEXT NOT NULL,
    "image_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "collection_image_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "Collection" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "collection_image_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "Image" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "view_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "image_id" TEXT NOT NULL,
    "viewed_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duration" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "view_history_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "Image" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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

-- CreateTable
CREATE TABLE "search_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "query" TEXT NOT NULL,
    "searched_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'waiting',
    "payload" TEXT NOT NULL,
    "result" TEXT,
    "error" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "started_at" DATETIME,
    "completed_at" DATETIME
);

-- CreateIndex
CREATE UNIQUE INDEX "AttributeLabel_name_key" ON "AttributeLabel"("name");

-- CreateIndex
CREATE UNIQUE INDEX "image_attribute_image_id_label_id_key" ON "image_attribute"("image_id", "label_id");

-- CreateIndex
CREATE UNIQUE INDEX "collection_image_collection_id_image_id_key" ON "collection_image"("collection_id", "image_id");

-- CreateIndex
CREATE INDEX "view_history_image_id_idx" ON "view_history"("image_id");

-- CreateIndex
CREATE INDEX "view_history_viewed_at_idx" ON "view_history"("viewed_at");

-- CreateIndex
CREATE UNIQUE INDEX "recommendation_conversion_view_history_id_key" ON "recommendation_conversion"("view_history_id");

-- CreateIndex
CREATE INDEX "recommendation_conversion_image_id_idx" ON "recommendation_conversion"("image_id");

-- CreateIndex
CREATE INDEX "recommendation_conversion_impression_at_idx" ON "recommendation_conversion"("impression_at");

-- CreateIndex
CREATE UNIQUE INDEX "search_history_query_key" ON "search_history"("query");

-- CreateIndex
CREATE INDEX "search_history_searched_at_idx" ON "search_history"("searched_at");

-- CreateIndex
CREATE INDEX "jobs_status_idx" ON "jobs"("status");

-- CreateIndex
CREATE INDEX "jobs_type_status_idx" ON "jobs"("type", "status");
