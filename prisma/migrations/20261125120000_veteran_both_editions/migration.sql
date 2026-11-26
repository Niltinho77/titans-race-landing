-- Só quem correu a 1ª e a 2ª edição ganha o desconto de veterano.
ALTER TABLE "VeteranAthlete" ADD COLUMN "bothEditions" BOOLEAN NOT NULL DEFAULT false;
