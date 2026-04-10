import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";

const connectionString = 'postgresql://ivcf_manager:Cv927KuVLHsP1Kh767rM8t@localhost:5432/ivcf';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// 🔴 CONFIG
const HEALTH_PROFESSIONAL_ID = "372ef6aa-69e8-4f67-adbf-f247697a0573";
const QUESTIONNAIRE_SLUG = "ivcf-20"; // 🔥 usa slug ao invés de ID
const FILE_PATH = "C:\\Users\\danie\\Downloads/Coletas IVCF-20 Sofia (respostas).xlsx";

// 🧠 normalização forte (resolve acento, espaço, etc)
const normalize = (text: string) =>
    text
        ?.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim() || "";

// 📊 ler excel
const parseExcel = () => {
    const workbook = XLSX.readFile(FILE_PATH);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sheet);
};

const excelDateToJSDate = (serial: number) => {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30)); // correção do bug do Excel
    return new Date(excelEpoch.getTime() + serial * 86400000);
};

const GENDER = {
    M: 'MALE',
    F: 'FEMALE',
    Masculino: 'MALE',
    Feminino: 'FEMALE',
}

const CLASSIFICATION = {
    "ROBUSTO: Baixa vulnerabilidade clínico funcional": "Robusto",
    "FRÁGIL: alta vulnerabilidade clínico funcional": "Frágil",
    "PRÉ FRAGIL: moderada vulnerabilidade clínico funcional" : "Pré-Fragil"
}

// 🔥 busca questionário completo
const getQuestionnaire = async () => {
    return prisma.questionnaire.findUnique({
        where: { slug: QUESTIONNAIRE_SLUG },
        include: {
            groups: {
                include: {
                    questions: {
                        include: {
                            options: true,
                        },
                    },
                    subGroups: {
                        include: {
                            questions: {
                                include: {
                                    options: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });
};

// 🔥 flatten das perguntas
const extractQuestions = (questionnaire: any) => {
    const questions: any[] = [];

    for (const group of questionnaire.groups) {
        for (const q of group.questions) questions.push(q);

        for (const sg of group.subGroups) {
            for (const q of sg.questions) questions.push(q);
        }
    }

    return questions;
};

// 🔥 faz match entre coluna e pergunta
const matchQuestion = (column: string, questions: any[]) => {
    const colNorm = normalize(column);

    return questions.find(q => {
        const qNorm = normalize(q.statement);
        return colNorm.includes(qNorm.slice(0, 30)); // match parcial inteligente
    });
};

const createParticipant = async (row: any) => {
    if (!row['Nome:']) return;

    const emailPrefix = normalize(row['Nome:']).split(' ').join('.');
    const email = `${emailPrefix}@import.com`;

    const obj = {
        fullName: row['Nome:'],
        fullName_normalized: normalize(row['Nome:']),
        email,
        birthday: excelDateToJSDate(row['Data de nascimento  ']),
        gender: GENDER[row['Sexo:  ']],
        height: Number(row['Estatura (cm) '] || 0),
        weight: Number(row['Massa (kg)'] || 0),
    }

    for (const key in obj) {
        if (obj[key] === undefined) throw new Error()
    }

    let userId = "";

    const userExist = await prisma.user.findUnique({
        where: { email }
    })

    if (userExist) {
        userId = userExist.id;
    } else {
        const user = await prisma.user.create({
            data: {
                email,
                fullName: obj.fullName,
                fullName_normalized: obj.fullName_normalized,
                password: 'imported',
                role: 'PARTICIPANT',
            },
        });

        userId = user.id;
    }

    const participantExist = await prisma.participant.findFirst({
        where: {
            user: {
                id: userId
            }
        }
    })

    let participantId = ""
    if (participantExist) {
        participantId = participantExist.id
    } else {
        const participant = await prisma.participant.create({
            data: {
                id: userId,
                birthday: obj.birthday,
                gender: obj.gender,
                height: obj.height,
                weight: obj.weight,
                zipCode: '',
                street: '',
                number: '0',
                city: '',
                state: '',
                neighborhood: '',
            },
        });

        participantId = participant.id
    }


    const professionalParticipantExist = await prisma.healthProfessionalParticipant.findFirst({
        where: {
            participantId,
            healthProfessionalId: HEALTH_PROFESSIONAL_ID,
        }
    })

    if (!professionalParticipantExist) {
        await prisma.healthProfessionalParticipant.create({
            data: {
                healthProfessionalId: HEALTH_PROFESSIONAL_ID,
                participantId: participantId,
            },
        });
    }

    return participantId;
};

// 🔥 resolve option automaticamente
const findOption = (question: any, value: string) => {
    const valNorm = normalize(value);

    return question.options.find((opt: any) =>
        normalize(opt.label).includes(valNorm)
    );
};

const run = async () => {
    const rows = parseExcel();
    const questionnaire = await getQuestionnaire();

    if (!questionnaire) {
        throw new Error("Questionário não encontrado");
    }

    const questions = extractQuestions(questionnaire);

    console.log(`📊 Linhas: ${rows.length}`);
    console.log(`🧠 Perguntas carregadas: ${questions.length}`);

    for (const _row of rows) {
        const row = _row as any;
        try {
            const participantId = await createParticipant(row);

            if (!participantId) continue;

            const response = await prisma.questionnaireResponse.create({
                data: {
                    participantId: participantId,
                    healthProfessionalId: HEALTH_PROFESSIONAL_ID,
                    questionnaireId: questionnaire.id,
                    totalScore: Number(row['Cálculo'] || 0),
                    classification:  CLASSIFICATION[row['Resultado']] || null,
                },
            });

            for (const column of Object.keys(row)) {
                if (!row[column]) continue;

                const question = matchQuestion(column, questions);

                if (!question) continue;

                let selectedOptionId = null;
                let valueText: string | null = null;

                if (question.type === "MULTIPLE_CHOICE") {
                    const option = findOption(question, row[column]);
                    console.log(option);
                    selectedOptionId = option?.id;
                } else {
                    valueText = String(row[column]);
                }

                if (!selectedOptionId && !valueText) continue;

                await prisma.answer.create({
                    data: {
                        questionnaireResponseId: response.id,
                        questionId: question.id,
                        selectedOptionId,
                        valueText,
                    },
                });
            }

            console.log(`✅ ${row['Nome:']}`);
        } catch (err) {
            console.error(`❌ Erro`, err);
        }
    }
};

const rollback = async () => {
    const participants = await prisma.participant.findMany({
        where: {
            healthProfessionalsLinks: {
                some: {
                    healthProfessionalId: '372ef6aa-69e8-4f67-adbf-f247697a0573',
                },
            },
        },
        select: { id: true },
    });

    const ids = participants.map(p => p.id);

    console.log(`🧹 Limpando ${ids.length} participantes`);

    // 1. deletar answers
    await prisma.answer.deleteMany({
        where: {
            questionnaireResponse: {
                participantId: { in: ids },
            },
        },
    });

    // 2. deletar responses
    await prisma.questionnaireResponse.deleteMany({
        where: {
            participantId: { in: ids },
        },
    });

    // 3. deletar vínculos
    await prisma.healthProfessionalParticipant.deleteMany({
        where: {
            participantId: { in: ids },
        },
    });

    // 4. agora sim pode deletar participant
    await prisma.participant.deleteMany({
        where: {
            id: { in: ids },
        },
    });

    console.log("✅ rollback concluído");
};

const argument = process.argv[2];

console.log(argument)

if (argument === "rollback") rollback();
else run();