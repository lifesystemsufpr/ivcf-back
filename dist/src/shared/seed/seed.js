"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const dotenv = require("dotenv");
const hash_password_1 = require("../src/shared/functions/hash-password");
const normalize_string_1 = require("../src/shared/functions/normalize-string");
const faker_1 = require("@faker-js/faker");
dotenv.config();
const prisma = new client_1.PrismaClient();
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
            description: "Índice de Vulnerabilidade Clínico-Funcional-20. Versão profissional de saúde.",
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
                                type: client_1.QuestionType.MULTIPLE_CHOICE,
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
                                statement: "Em geral, comparando com outras pessoas de sua idade, você diria que sua saúde é:",
                                order: 2,
                                type: client_1.QuestionType.MULTIPLE_CHOICE,
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
                                    statement: "Por causa de sua saúde ou condição física, você deixou de fazer compras?",
                                    order: 3,
                                    type: client_1.QuestionType.MULTIPLE_CHOICE,
                                    options: {
                                        create: [
                                            { label: "Não", score: 0, order: 1 },
                                            { label: "Sim", score: 4, order: 2 },
                                        ],
                                    },
                                },
                                {
                                    statement: "Por causa de sua saúde ou condição física, você deixou de controlar seu dinheiro?",
                                    order: 4,
                                    type: client_1.QuestionType.MULTIPLE_CHOICE,
                                    options: {
                                        create: [
                                            { label: "Não", score: 0, order: 1 },
                                            { label: "Sim", score: 4, order: 2 },
                                        ],
                                    },
                                },
                                {
                                    statement: "Por causa de sua saúde ou condição física, você deixou de realizar pequenos trabalhos domésticos?",
                                    order: 5,
                                    type: client_1.QuestionType.MULTIPLE_CHOICE,
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
                                statement: "Por causa de sua saúde ou condição física, você deixou de tomar banho sozinho?",
                                order: 6,
                                type: client_1.QuestionType.MULTIPLE_CHOICE,
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
                                    statement: "Algum familiar ou amigo falou que você está ficando esquecido?",
                                    order: 7,
                                    type: client_1.QuestionType.MULTIPLE_CHOICE,
                                    options: {
                                        create: [
                                            { label: "Não", score: 0, order: 1 },
                                            { label: "Sim", score: 0, order: 2 },
                                        ],
                                    },
                                },
                                {
                                    statement: "Este esquecimento está piorando nos últimos meses?",
                                    order: 8,
                                    type: client_1.QuestionType.MULTIPLE_CHOICE,
                                    options: {
                                        create: [
                                            { label: "Não", score: 0, order: 1 },
                                            { label: "Sim", score: 0, order: 2 },
                                        ],
                                    },
                                },
                                {
                                    statement: "Este esquecimento está impedindo a realização de alguma atividade do cotidiano?",
                                    order: 9,
                                    type: client_1.QuestionType.MULTIPLE_CHOICE,
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
                                    statement: "No último mês, você ficou com desânimo, tristeza ou desesperança?",
                                    order: 10,
                                    type: client_1.QuestionType.MULTIPLE_CHOICE,
                                    options: {
                                        create: [
                                            { label: "Não", score: 0, order: 1 },
                                            { label: "Sim", score: 0, order: 2 },
                                        ],
                                    },
                                },
                                {
                                    statement: "No último mês, você perdeu o interesse ou prazer em atividades anteriormente prazerosas?",
                                    order: 11,
                                    type: client_1.QuestionType.MULTIPLE_CHOICE,
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
                                                statement: "Você é incapaz de elevar os braços acima do nível do ombro?",
                                                order: 12,
                                                type: client_1.QuestionType.MULTIPLE_CHOICE,
                                                options: {
                                                    create: [
                                                        { label: "Não", score: 0, order: 1 },
                                                        { label: "Sim", score: 1, order: 2 },
                                                    ],
                                                },
                                            },
                                            {
                                                statement: "Você é incapaz de manusear ou segurar pequenos objetos?",
                                                order: 13,
                                                type: client_1.QuestionType.MULTIPLE_CHOICE,
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
                                            statement: "Você tem alguma das quatro condições abaixo? (Perda de peso, IMC baixo, etc)",
                                            order: 14,
                                            type: client_1.QuestionType.MULTIPLE_CHOICE,
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
                                                statement: "Você tem dificuldade para caminhar capaz de impedir a realização de alguma atividade do cotidiano?",
                                                order: 15,
                                                type: client_1.QuestionType.MULTIPLE_CHOICE,
                                                options: {
                                                    create: [
                                                        { label: "Não", score: 0, order: 1 },
                                                        { label: "Sim", score: 2, order: 2 },
                                                    ],
                                                },
                                            },
                                            {
                                                statement: "Você teve duas ou mais quedas no último ano?",
                                                order: 16,
                                                type: client_1.QuestionType.MULTIPLE_CHOICE,
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
                                            statement: "Você perde urina ou fezes, sem querer, em algum momento?",
                                            order: 17,
                                            type: client_1.QuestionType.MULTIPLE_CHOICE,
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
                                            statement: "Você tem problemas de visão capazes de impedir a realização de alguma atividade do cotidiano?",
                                            order: 18,
                                            type: client_1.QuestionType.MULTIPLE_CHOICE,
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
                                            statement: "Você tem problemas de audição capazes de impedir a realização de alguma atividade do cotidiano?",
                                            order: 19,
                                            type: client_1.QuestionType.MULTIPLE_CHOICE,
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
                                statement: "Você tem alguma das três condições? (Polipatologia, Polifarmácia, Internação recente)",
                                order: 20,
                                type: client_1.QuestionType.MULTIPLE_CHOICE,
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
                    questions: { include: { options: true } },
                    subGroups: {
                        include: {
                            questions: { include: { options: true } },
                        },
                    },
                },
            },
        },
    });
    const flatQuestions = [];
    if (ivcfFull?.groups) {
        ivcfFull.groups.forEach((group) => {
            if (group.questions) {
                flatQuestions.push(...group.questions);
            }
            if (group.subGroups) {
                group.subGroups.forEach((sub) => {
                    if (sub.questions) {
                        flatQuestions.push(...sub.questions);
                    }
                });
            }
        });
    }
    const passwordHash = await (0, hash_password_1.hashPassword)("senha123");
    console.log("👑 Criando Usuários Fixos...");
    await prisma.user.create({
        data: {
            cpf: "00000000000",
            fullName: "Admin do Sistema",
            fullName_normalized: "admin do sistema",
            gender: client_1.Gender.OTHER,
            password: passwordHash,
            role: client_1.SystemRole.MANAGER,
        },
    });
    const fixedDoctor = await prisma.user.create({
        data: {
            cpf: "11111111111",
            fullName: "Dra. Ana Fixa",
            fullName_normalized: "dra. ana fixa",
            gender: client_1.Gender.FEMALE,
            password: passwordHash,
            role: client_1.SystemRole.HEALTH_PROFESSIONAL,
            healthProfessional: {
                create: {
                    email: "ana.fixa@teste.com",
                    speciality: "Geriatria",
                    speciality_normalized: "geriatria",
                },
            },
        },
        include: { healthProfessional: true },
    });
    const healthProsIds = [];
    if (fixedDoctor.healthProfessional) {
        healthProsIds.push(fixedDoctor.healthProfessional.id);
    }
    console.log("🏥 Criando Estrutura...");
    await prisma.institution.create({
        data: {
            title: "UFPR",
            title_normalized: (0, normalize_string_1.normalizeString)("UFPR") || "ufpr",
        },
    });
    const units = await Promise.all([
        prisma.healthcareUnit.create({
            data: {
                name: "UBS Centro",
                name_normalized: (0, normalize_string_1.normalizeString)("UBS Centro") || "ubs centro",
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
                name_normalized: (0, normalize_string_1.normalizeString)("Hospital de Clínicas") || "hospital de clinicas",
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
        const name = faker_1.fakerPT_BR.person.fullName();
        const hpUser = await prisma.user.create({
            data: {
                cpf: faker_1.fakerPT_BR.string.numeric(11),
                fullName: name,
                fullName_normalized: (0, normalize_string_1.normalizeString)(name) || name.toLowerCase(),
                gender: i % 2 === 0 ? client_1.Gender.MALE : client_1.Gender.FEMALE,
                password: passwordHash,
                role: client_1.SystemRole.HEALTH_PROFESSIONAL,
                healthProfessional: {
                    create: {
                        email: faker_1.fakerPT_BR.internet.email(),
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
        const name = faker_1.fakerPT_BR.person.fullName({ sex });
        const participantUser = await prisma.user.create({
            data: {
                cpf: faker_1.fakerPT_BR.string.numeric(11),
                fullName: name,
                fullName_normalized: (0, normalize_string_1.normalizeString)(name) || name.toLowerCase(),
                gender: sex === "male" ? client_1.Gender.MALE : client_1.Gender.FEMALE,
                password: passwordHash,
                role: client_1.SystemRole.PARTICIPANT,
                participant: {
                    create: {
                        birthday: faker_1.fakerPT_BR.date.birthdate({ min: 60, max: 90, mode: "age" }),
                        weight: faker_1.fakerPT_BR.number.int({ min: 50, max: 100 }),
                        height: faker_1.fakerPT_BR.number.int({ min: 150, max: 190 }),
                        zipCode: "80000000",
                        street: faker_1.fakerPT_BR.location.street(),
                        number: String(faker_1.fakerPT_BR.number.int({ min: 1, max: 1000 })),
                        city: "Curitiba",
                        state: "PR",
                        neighborhood: "Batel",
                        socio_economic_level: client_1.SocialEconomicLevel.C,
                        scholarship: client_1.Scholarship.HIGH_SCHOOL_COMPLETE,
                    },
                },
            },
            include: { participant: true },
        });
        if (!participantUser.participant)
            continue;
        const participantId = participantUser.participant.id;
        const randomHPId = healthProsIds[Math.floor(Math.random() * healthProsIds.length)];
        if (Math.random() > 0.2 && ivcfFull) {
            const responseDate = faker_1.fakerPT_BR.date.recent({ days: 90 });
            const randomUnit = units[Math.floor(Math.random() * units.length)];
            let totalScore = 0;
            const answersData = [];
            const scoresByGroup = {};
            for (const question of flatQuestions) {
                if (!question.options || question.options.length === 0)
                    continue;
                const isHealthy = Math.random() > 0.4;
                const selectedOption = isHealthy
                    ? question.options.find((o) => o.score === 0) ||
                        question.options[0]
                    : question.options[Math.floor(Math.random() * question.options.length)];
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
                if (groupData.order === 3)
                    groupTotal = Math.min(groupTotal, 4);
                if (groupData.order === 6)
                    groupTotal = Math.min(groupTotal, 2);
                if (groupData.order === 9)
                    groupTotal = Math.min(groupTotal, 4);
                totalScore += groupTotal;
            });
            let classification = "Robusto";
            if (totalScore >= 7 && totalScore <= 14) {
                classification = "Em Risco de Fragilização";
            }
            else if (totalScore >= 15) {
                classification = "Frágil";
            }
            await prisma.questionnaireResponse.create({
                data: {
                    participantId: participantId,
                    healthProfessionalId: randomHPId,
                    healthcareUnitId: randomUnit.id,
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
    console.log("🔑 CREDENCIAIS:");
    console.log("   ADMIN:   CPF 00000000000 / senha123");
    console.log("   MÉDICO:  CPF 11111111111 / senha123");
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
//# sourceMappingURL=seed.js.map