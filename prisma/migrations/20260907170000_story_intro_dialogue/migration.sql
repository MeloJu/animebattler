-- Cena de diálogo antes da luta. Anulável: estágio sem cena cai no
-- comportamento antigo, que é mostrar apenas o introText.
ALTER TABLE "StoryStage" ADD COLUMN "introDialogue" JSONB;
