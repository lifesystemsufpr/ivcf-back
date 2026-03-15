import {
  PrismaClient,
  SystemRole,
  Gender,
  Scholarship,
  SocialEconomicLevel,
  QuestionType,
} from "@prisma/client";
import { hashPassword } from "../src/shared/functions/hash-password";
import { normalizeString } from "../src/shared/functions/normalize-string";
import { fakerPT_BR as faker } from "@faker-js/faker";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Iniciando o Seed Completo...");

  console.log("🗑️ Limpando dados antigos...");

  await prisma.answer.deleteMany({});
  await prisma.questionnaireResponse.deleteMany({});
  await prisma.questionOption.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.questionSubGroup.deleteMany({});
  await prisma.questionGroup.deleteMany({});
  await prisma.questionnaire.deleteMany({});

  await prisma.participant.deleteMany({});
  await prisma.researcher.deleteMany({});
  await prisma.healthProfessional.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.institution.deleteMany({});
  await prisma.healthcareUnit.deleteMany({});

  console.log("📝 Criando Questionário IVCF-20 Estrutural...");

  const createdIvcf = await prisma.questionnaire.create({
    data: {
      title: "IVCF-20",
      slug: "ivcf-20",
      description:
        "Índice de Vulnerabilidade Clínico-Funcional-20. Versão profissional de saúde.",
      version: "1.0",
      active: true,
      groups: {
        create: [
          {
            title: "Idade",
            order: 1,
            questions: {
              create: {
                statement: "Qual é a sua idade?",
                order: 1,
                type: QuestionType.MULTIPLE_CHOICE,
                options: {
                  create: [
                    { label: "60 a 74 anos", score: 0, order: 1 },
                    { label: "75 a 84 anos", score: 1, order: 2 },
                    { label: "≥ 85 anos", score: 3, order: 3 },
                  ],
                },
              },
            },
          },
          {
            title: "Autopercepção da Saúde",
            order: 2,
            questions: {
              create: {
                statement:
                  "Em geral, comparando com outras pessoas de sua idade, você diria que sua saúde é:",
                order: 2,
                type: QuestionType.MULTIPLE_CHOICE,
                options: {
                  create: [
                    {
                      label: "Excelente, muito boa ou boa",
                      score: 0,
                      order: 1,
                    },
                    { label: "Regular ou ruim", score: 1, order: 2 },
                  ],
                },
              },
            },
          },
          {
            title: "Atividades de Vida Diária (AVD Instrumental)",
            description: "Pontuação máxima do grupo: 4 pontos.",
            order: 3,
            questions: {
              create: [
                {
                  statement:
                    "Por causa de sua saúde ou condição física, você deixou de fazer compras?",
                  order: 3,
                  type: QuestionType.MULTIPLE_CHOICE,
                  options: {
                    create: [
                      { label: "Não", score: 0, order: 1 },
                      { label: "Sim", score: 4, order: 2 },
                    ],
                  },
                },
                {
                  statement:
                    "Por causa de sua saúde ou condição física, você deixou de controlar seu dinheiro?",
                  order: 4,
                  type: QuestionType.MULTIPLE_CHOICE,
                  options: {
                    create: [
                      { label: "Não", score: 0, order: 1 },
                      { label: "Sim", score: 4, order: 2 },
                    ],
                  },
                },
                {
                  statement:
                    "Por causa de sua saúde ou condição física, você deixou de realizar pequenos trabalhos domésticos?",
                  order: 5,
                  type: QuestionType.MULTIPLE_CHOICE,
                  options: {
                    create: [
                      { label: "Não", score: 0, order: 1 },
                      { label: "Sim", score: 4, order: 2 },
                    ],
                  },
                },
              ],
            },
          },
          {
            title: "Atividades de Vida Diária (AVD Básica)",
            order: 4,
            questions: {
              create: {
                statement:
                  "Por causa de sua saúde ou condição física, você deixou de tomar banho sozinho?",
                order: 6,
                type: QuestionType.MULTIPLE_CHOICE,
                options: {
                  create: [
                    { label: "Não", score: 0, order: 1 },
                    { label: "Sim", score: 6, order: 2 },
                  ],
                },
              },
            },
          },
          {
            title: "Cognição",
            order: 5,
            questions: {
              create: [
                {
                  statement:
                    "Algum familiar ou amigo falou que você está ficando esquecido?",
                  order: 7,
                  type: QuestionType.MULTIPLE_CHOICE,
                  options: {
                    create: [
                      { label: "Não", score: 0, order: 1 },
                      { label: "Sim", score: 0, order: 2 },
                    ],
                  },
                },
                {
                  statement:
                    "Este esquecimento está piorando nos últimos meses?",
                  order: 8,
                  type: QuestionType.MULTIPLE_CHOICE,
                  options: {
                    create: [
                      { label: "Não", score: 0, order: 1 },
                      { label: "Sim", score: 0, order: 2 },
                    ],
                  },
                },
                {
                  statement:
                    "Este esquecimento está impedindo a realização de alguma atividade do cotidiano?",
                  order: 9,
                  type: QuestionType.MULTIPLE_CHOICE,
                  options: {
                    create: [
                      { label: "Não", score: 0, order: 1 },
                      { label: "Sim", score: 4, order: 2 },
                    ],
                  },
                },
              ],
            },
          },
          {
            title: "Humor",
            order: 6,
            questions: {
              create: [
                {
                  statement:
                    "No último mês, você ficou com desânimo, tristeza ou desesperança?",
                  order: 10,
                  type: QuestionType.MULTIPLE_CHOICE,
                  options: {
                    create: [
                      { label: "Não", score: 0, order: 1 },
                      { label: "Sim", score: 0, order: 2 },
                    ],
                  },
                },
                {
                  statement:
                    "No último mês, você perdeu o interesse ou prazer em atividades anteriormente prazerosas?",
                  order: 11,
                  type: QuestionType.MULTIPLE_CHOICE,
                  options: {
                    create: [
                      { label: "Não", score: 0, order: 1 },
                      { label: "Sim", score: 2, order: 2 },
                    ],
                  },
                },
              ],
            },
          },
          {
            title: "Mobilidade",
            order: 7,
            subGroups: {
              create: [
                {
                  title: "Alcance, preensão e pinça",
                  order: 1,
                  questions: {
                    create: [
                      {
                        statement:
                          "Você é incapaz de elevar os braços acima do nível do ombro?",
                        order: 12,
                        type: QuestionType.MULTIPLE_CHOICE,
                        options: {
                          create: [
                            { label: "Não", score: 0, order: 1 },
                            { label: "Sim", score: 1, order: 2 },
                          ],
                        },
                      },
                      {
                        statement:
                          "Você é incapaz de manusear ou segurar pequenos objetos?",
                        order: 13,
                        type: QuestionType.MULTIPLE_CHOICE,
                        options: {
                          create: [
                            { label: "Não", score: 0, order: 1 },
                            { label: "Sim", score: 1, order: 2 },
                          ],
                        },
                      },
                    ],
                  },
                },
                {
                  title: "Capacidade aeróbica / Muscular",
                  order: 2,
                  questions: {
                    create: {
                      statement:
                        "Você tem alguma das quatro condições abaixo? (Perda de peso, IMC baixo, etc)",
                      order: 14,
                      type: QuestionType.MULTIPLE_CHOICE,
                      options: {
                        create: [
                          { label: "Não", score: 0, order: 1 },
                          { label: "Sim", score: 2, order: 2 },
                        ],
                      },
                    },
                  },
                },
                {
                  title: "Marcha",
                  order: 3,
                  questions: {
                    create: [
                      {
                        statement:
                          "Você tem dificuldade para caminhar capaz de impedir a realização de alguma atividade do cotidiano?",
                        order: 15,
                        type: QuestionType.MULTIPLE_CHOICE,
                        options: {
                          create: [
                            { label: "Não", score: 0, order: 1 },
                            { label: "Sim", score: 2, order: 2 },
                          ],
                        },
                      },
                      {
                        statement:
                          "Você teve duas ou mais quedas no último ano?",
                        order: 16,
                        type: QuestionType.MULTIPLE_CHOICE,
                        options: {
                          create: [
                            { label: "Não", score: 0, order: 1 },
                            { label: "Sim", score: 2, order: 2 },
                          ],
                        },
                      },
                    ],
                  },
                },
                {
                  title: "Continência",
                  order: 4,
                  questions: {
                    create: {
                      statement:
                        "Você perde urina ou fezes, sem querer, em algum momento?",
                      order: 17,
                      type: QuestionType.MULTIPLE_CHOICE,
                      options: {
                        create: [
                          { label: "Não", score: 0, order: 1 },
                          { label: "Sim", score: 2, order: 2 },
                        ],
                      },
                    },
                  },
                },
              ],
            },
          },
          {
            title: "Comunicação",
            order: 8,
            subGroups: {
              create: [
                {
                  title: "Visão",
                  order: 1,
                  questions: {
                    create: {
                      statement:
                        "Você tem problemas de visão capazes de impedir a realização de alguma atividade do cotidiano?",
                      order: 18,
                      type: QuestionType.MULTIPLE_CHOICE,
                      options: {
                        create: [
                          { label: "Não", score: 0, order: 1 },
                          { label: "Sim", score: 2, order: 2 },
                        ],
                      },
                    },
                  },
                },
                {
                  title: "Audição",
                  order: 2,
                  questions: {
                    create: {
                      statement:
                        "Você tem problemas de audição capazes de impedir a realização de alguma atividade do cotidiano?",
                      order: 19,
                      type: QuestionType.MULTIPLE_CHOICE,
                      options: {
                        create: [
                          { label: "Não", score: 0, order: 1 },
                          { label: "Sim", score: 2, order: 2 },
                        ],
                      },
                    },
                  },
                },
              ],
            },
          },
          {
            title: "Comorbidades Múltiplas",
            order: 9,
            questions: {
              create: {
                statement:
                  "Você tem alguma das três condições? (Polipatologia, Polifarmácia, Internação recente)",
                order: 20,
                type: QuestionType.MULTIPLE_CHOICE,
                options: {
                  create: [
                    { label: "Não", score: 0, order: 1 },
                    { label: "Sim", score: 4, order: 2 },
                  ],
                },
              },
            },
          },
        ],
      },
    },
  });

  const ivcfFull = await prisma.questionnaire.findUnique({
    where: { id: createdIvcf.id },
    include: {
      groups: {
        include: {
          questions: { include: { options: true, group: true } },
          subGroups: {
            include: {
              questions: {
                include: {
                  options: true,
                  subGroup: { include: { group: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  const flatQuestions: any[] = [];
  if (ivcfFull?.groups) {
    ivcfFull.groups.forEach((group: any) => {
      if (group.questions) {
        flatQuestions.push(...group.questions);
      }
      if (group.subGroups) {
        group.subGroups.forEach((sub: any) => {
          if (sub.questions) {
            flatQuestions.push(...sub.questions);
          }
        });
      }
    });
  }

  const passwordHash = await hashPassword("senha123");

  console.log("👑 Criando Usuários Fixos...");

  const fixedDoctor = await prisma.user.create({
    data: {
      email: "medico@sistema.com",
      fullName: "Dra. Ana Fixa",
      fullName_normalized: "dra. ana fixa",
      gender: Gender.FEMALE,
      password: passwordHash,
      role: SystemRole.HEALTH_PROFESSIONAL,
      healthProfessional: {
        create: {
          // O email foi removido daqui pois pertence apenas ao 'User'
          speciality: "Geriatria",
          speciality_normalized: "geriatria",
        },
      },
    },
    include: { healthProfessional: true },
  });

  const healthProsIds: string[] = [];
  if (fixedDoctor.healthProfessional) {
    healthProsIds.push(fixedDoctor.healthProfessional.id);
  }

  console.log("🏥 Criando Estrutura...");

  await prisma.institution.create({
    data: {
      title: "UFPR",
      title_normalized: normalizeString("UFPR") || "ufpr",
    },
  });

  const units = await Promise.all([
    prisma.healthcareUnit.create({
      data: {
        name: "UBS Centro",
        name_normalized: normalizeString("UBS Centro") || "ubs centro",
        zipCode: "80000000",
        street: "Rua XV",
        number: "10",
        city: "Curitiba",
        state: "PR",
        neighborhood: "Centro",
      },
    }),
    prisma.healthcareUnit.create({
      data: {
        name: "Hospital de Clínicas",
        name_normalized:
          normalizeString("Hospital de Clínicas") || "hospital de clinicas",
        zipCode: "80060000",
        street: "General Carneiro",
        number: "181",
        city: "Curitiba",
        state: "PR",
        neighborhood: "Alto da Glória",
      },
    }),
  ]);

  console.log("👨‍⚕️ Criando Profissionais Aleatórios...");
  for (let i = 0; i < 5; i++) {
    const name = faker.person.fullName();
    const hpEmail = `medico${i}@teste.com`;

    const hpUser = await prisma.user.create({
      data: {
        email: hpEmail,
        fullName: name,
        fullName_normalized: normalizeString(name) || name.toLowerCase(),
        gender: i % 2 === 0 ? Gender.MALE : Gender.FEMALE,
        password: passwordHash,
        role: SystemRole.HEALTH_PROFESSIONAL,
        healthProfessional: {
          create: {
            // O email foi removido daqui pois pertence apenas ao 'User'
            speciality: "Fisioterapia",
            speciality_normalized: "fisioterapia",
          },
        },
      },
      include: { healthProfessional: true },
    });

    if (hpUser.healthProfessional) {
      healthProsIds.push(hpUser.healthProfessional.id);
    }
  }

  console.log("👴 Criando 20 Pacientes com Questionários...");

  for (let i = 0; i < 20; i++) {
    const sex = i % 2 === 0 ? "male" : "female";
    const name = faker.person.fullName({ sex });
    const participantEmail = `paciente${i}@teste.com`;

    const participantUser = await prisma.user.create({
      data: {
        email: participantEmail,
        fullName: name,
        fullName_normalized: normalizeString(name) || name.toLowerCase(),
        gender: sex === "male" ? Gender.MALE : Gender.FEMALE,
        password: passwordHash,
        role: SystemRole.PARTICIPANT,
        participant: {
          create: {
            birthday: faker.date.birthdate({ min: 60, max: 90, mode: "age" }),
            weight: faker.number.int({ min: 50, max: 100 }),
            height: faker.number.int({ min: 150, max: 190 }),
            zipCode: "80000000",
            street: faker.location.street(),
            number: String(faker.number.int({ min: 1, max: 1000 })),
            city: "Curitiba",
            state: "PR",
            neighborhood: "Batel",
            socio_economic_level: SocialEconomicLevel.C,
            scholarship: Scholarship.HIGH_SCHOOL_COMPLETE,
          },
        },
      },
      include: { participant: true },
    });

    if (!participantUser.participant) continue;
    const participantId = participantUser.participant.id;
    const randomHPId =
      healthProsIds[Math.floor(Math.random() * healthProsIds.length)];

    if (Math.random() > 0.2 && ivcfFull) {
      const responseDate = faker.date.recent({ days: 90 });
      const randomUnit = units[Math.floor(Math.random() * units.length)];
      let totalScore = 0;

      const answersData: { questionId: string; selectedOptionId: string }[] =
        [];
      const scoresByGroup: Record<string, { score: number; order: number }> =
        {};

      for (const question of flatQuestions) {
        if (!question.options || question.options.length === 0) continue;

        const isHealthy = Math.random() > 0.4;
        const selectedOption = isHealthy
          ? question.options.find((o: any) => o.score === 0) ||
            question.options[0]
          : question.options[
              Math.floor(Math.random() * question.options.length)
            ];

        answersData.push({
          questionId: question.id,
          selectedOptionId: selectedOption.id,
        });

        const group = question.group || question.subGroup?.group;
        if (group) {
          if (!scoresByGroup[group.id]) {
            scoresByGroup[group.id] = { score: 0, order: group.order };
          }
          scoresByGroup[group.id].score += selectedOption.score;
        }
      }

      Object.values(scoresByGroup).forEach((groupData) => {
        let groupTotal = groupData.score;
        if (groupData.order === 3) groupTotal = Math.min(groupTotal, 4);
        if (groupData.order === 6) groupTotal = Math.min(groupTotal, 2);
        if (groupData.order === 9) groupTotal = Math.min(groupTotal, 4);
        totalScore += groupTotal;
      });

      let classification = "Robusto";
      if (totalScore >= 7 && totalScore <= 14) {
        classification = "Pré-frágil";
      } else if (totalScore >= 15) {
        classification = "Frágil";
      }

      await prisma.questionnaireResponse.create({
        data: {
          participantId: participantId,
          healthProfessionalId: randomHPId,
          questionnaireId: ivcfFull.id,
          date: responseDate,
          totalScore: totalScore,
          classification: classification,
          answers: {
            create: answersData,
          },
        },
      });
    }
  }

  console.log("✅ Seed concluído com sucesso!");
  console.log("------------------------------------------------");
  console.log("🔑 CREDENCIAIS DE TESTE:");
  console.log("   MÉDICO:  medico@sistema.com / senha123");
  console.log(
    "   (Demais profissionais e pacientes seguem o padrão medicoX@teste.com, pacienteX@teste.com)",
  );
  console.log("------------------------------------------------");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
