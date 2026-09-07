-- Dreno de VIDA, separado do de energia: ficar sem energia faz a forma cair,
-- ficar sem vida faz o personagem morrer. É o custo dos Oito Portões e do
-- Mangekyō, que na obra cobram o corpo e não o chakra.
ALTER TABLE "Transformation" ADD COLUMN "drainHpPerTurn" INTEGER NOT NULL DEFAULT 0;

-- Espaço para ícone. Curto de propósito — emoji ou nome de glifo de
-- biblioteca aberta —, porque arte de anime é material com direito autoral e
-- este repositório é público.
ALTER TABLE "Skill" ADD COLUMN "icon" TEXT;
ALTER TABLE "Trait" ADD COLUMN "icon" TEXT;
ALTER TABLE "SkillTreeNode" ADD COLUMN "icon" TEXT;
