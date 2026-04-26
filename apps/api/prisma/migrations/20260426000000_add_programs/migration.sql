-- CreateTable
CREATE TABLE "programs" (
    "id" TEXT NOT NULL,
    "station_id" TEXT NOT NULL,
    "dj_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "duration_secs" INTEGER NOT NULL,
    "playback_url" TEXT NOT NULL,
    "cover_art_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "programs_station_id_recorded_at_key" ON "programs"("station_id", "recorded_at");

-- AddForeignKey
ALTER TABLE "programs" ADD CONSTRAINT "programs_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
