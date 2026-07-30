-- Permite usar igualdade com UUID dentro de um índice GiST.
CREATE EXTENSION IF NOT EXISTS btree_gist;
--> statement-breakpoint

-- Impede reservas com horários sobrepostos na mesma sala.
ALTER TABLE "reservations"
ADD CONSTRAINT "reservations_no_time_overlap"
EXCLUDE USING gist (
  "room_id" WITH =,
  tstzrange("starts_at", "ends_at", '[)') WITH &&
);
