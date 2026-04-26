-- AlterTable: add ownership and PlayGen fields to stations
ALTER TABLE "stations" ADD COLUMN "owner_id" TEXT;
ALTER TABLE "stations" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'off_air';
ALTER TABLE "stations" ADD COLUMN "playgen_station_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "stations_playgen_station_id_key" ON "stations"("playgen_station_id");

-- AlterTable: add PlayGen fields to djs
ALTER TABLE "djs" ADD COLUMN "playgen_dj_id" TEXT;
ALTER TABLE "djs" ADD COLUMN "locale_cities" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "djs" ADD COLUMN "languages" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "djs" ADD COLUMN "personality" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "djs_playgen_dj_id_key" ON "djs"("playgen_dj_id");

-- CreateTable
CREATE TABLE "station_programs" (
    "id" TEXT NOT NULL,
    "station_id" TEXT NOT NULL,
    "playgen_program_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "duration_secs" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "station_programs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "station_programs_playgen_program_id_key" ON "station_programs"("playgen_program_id");

-- AddForeignKey
ALTER TABLE "stations" ADD CONSTRAINT "stations_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "listeners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "station_programs" ADD CONSTRAINT "station_programs_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
