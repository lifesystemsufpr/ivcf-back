-- Corrige pontuações IVCF-20 das opções "Sim" de Cognição (Q7, Q8, Q9) e Humor (Q10)
-- conforme tabela oficial do IVCF-20.

UPDATE "question_option" qo
SET "score" = 1
FROM "question" q, "question_group" g, "questionnaire" qn
WHERE qo."questionId" = q."id"
  AND q."groupId" = g."id"
  AND g."questionnaireId" = qn."id"
  AND qn."slug" = 'ivcf-20'
  AND q."order" = 7
  AND qo."label" = 'Sim';

UPDATE "question_option" qo
SET "score" = 1
FROM "question" q, "question_group" g, "questionnaire" qn
WHERE qo."questionId" = q."id"
  AND q."groupId" = g."id"
  AND g."questionnaireId" = qn."id"
  AND qn."slug" = 'ivcf-20'
  AND q."order" = 8
  AND qo."label" = 'Sim';

UPDATE "question_option" qo
SET "score" = 2
FROM "question" q, "question_group" g, "questionnaire" qn
WHERE qo."questionId" = q."id"
  AND q."groupId" = g."id"
  AND g."questionnaireId" = qn."id"
  AND qn."slug" = 'ivcf-20'
  AND q."order" = 9
  AND qo."label" = 'Sim';

UPDATE "question_option" qo
SET "score" = 2
FROM "question" q, "question_group" g, "questionnaire" qn
WHERE qo."questionId" = q."id"
  AND q."groupId" = g."id"
  AND g."questionnaireId" = qn."id"
  AND qn."slug" = 'ivcf-20'
  AND q."order" = 10
  AND qo."label" = 'Sim';
