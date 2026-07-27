-- Atualiza o texto das perguntas 18 e 19.
-- A correção é aplicada via migration para atingir os dados já existentes em produção.

UPDATE "question" q
SET "statement" = 'Você tem problemas de visão capazes de impedir a realização de alguma atividade do cotidiano? É permitido o uso de óculos ou lentes de contato.'
FROM "question_subgroup" sg,
     "question_group" g,
     "questionnaire" qn
WHERE q."subGroupId" = sg."id"
  AND sg."groupId" = g."id"
  AND g."questionnaireId" = qn."id"
  AND qn."slug" = 'ivcf-20'
  AND q."order" = 18;

UPDATE "question" q
SET "statement" = 'Você tem problemas de audição capazes de impedir a realização de alguma atividade do cotidiano? É permitido o uso de aparelhos de audição.'
FROM "question_subgroup" sg,
     "question_group" g,
     "questionnaire" qn
WHERE q."subGroupId" = sg."id"
  AND sg."groupId" = g."id"
  AND g."questionnaireId" = qn."id"
  AND qn."slug" = 'ivcf-20'
  AND q."order" = 19;