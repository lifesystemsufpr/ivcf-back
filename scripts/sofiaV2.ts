import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";
import * as fs from "fs";
import { parse } from "csv-parse/sync";

// DB
const connectionString = 'postgresql://ivcf_manager:Cv927KuVLHsP1Kh767rM8t@localhost:5432/ivcf';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// CONFIG
const HEALTH_PROFESSIONAL_ID = "372ef6aa-69e8-4f67-adbf-f247697a0573";
const QUESTIONNAIRE_SLUG = "ivcf-20";
const FILE_PATH = "C:\\Users\\danie\\Downloads/Coletas IVCF-20 Sofia (respostas).xlsx";
const LOG_FILE = "./import.log";

// RANGE
const START_ROW = 1;
const END_ROW = 116;

const DRY_RUN = process.argv.includes("--dry-run");

const OPTION_ALIASES: Record<string, string> = {
    "nao ou nao faz compras por outros motivos que nao a saude": "nao",
};

// const ANSWERS_ALIASES: Record<string, string> = {
//     "Por causa de sua saúde ou condição física, você deixou de controlar seu dinheiro, gasto ou pagar as contas de sua casa?" : "por causa de sua saude ou condicao fisica, voce deixou de controlar seu dinheiro?",
//     "Por causa de sua saúde ou condição física, você deixou de realizar pequenos trabalhos domésticos, como lavar louça, arrumar a casa ou fazer limpeza leve?": "por causa de sua saude ou condicao fisica, voce deixou de realizar pequenos trabalhos domesticos?",
//     "Você tem alguma das três condições abaixo relacionadas?  (FAZER MEDIDAS)": "voce tem alguma das quatro condicoes abaixo? (perda de peso, imc baixo, etc)",
//     "Você tem problemas de visão capazes de impedir a realização de alguma atividade do cotidiano? (É permitido o uso de óculos ou lentes de contato.)   ": "voce tem problemas de visao capazes de impedir a realizacao de alguma atividade do cotidiano?",
//     "Você tem problemas de audição capazes de impedir a realização de alguma atividade do cotidiano? (É permitido o uso de aparelhos de audição.)  ": "voce tem problemas de audicao capazes de impedir a realizacao de alguma atividade do cotidiano?",
//     "Você tem alguma das três condições abaixo relacionadas?": "voce tem alguma das tres condicoes? (polipatologia, polifarmacia, internacao recente)"
// }

const ANSWERS_ALIASES: Record<string, string> = {
    "por causa de sua saude ou condicao fisica, voce deixou de controlar seu dinheiro?": "Por causa de sua saúde ou condição física, você deixou de controlar seu dinheiro, gasto ou pagar as contas de sua casa?",
    "por causa de sua saude ou condicao fisica, voce deixou de realizar pequenos trabalhos domesticos?": "Por causa de sua saúde ou condição física, você deixou de realizar pequenos trabalhos domésticos, como lavar louça, arrumar a casa ou fazer limpeza leve?",
    "voce tem alguma das quatro condicoes abaixo? (perda de peso, imc baixo, etc)": "Você tem alguma das três condições abaixo relacionadas?  (FAZER MEDIDAS)",
    "voce tem problemas de visao capazes de impedir a realizacao de alguma atividade do cotidiano?": "Você tem problemas de visão capazes de impedir a realização de alguma atividade do cotidiano? (É permitido o uso de óculos ou lentes de contato.)   ",
    "voce tem problemas de audicao capazes de impedir a realizacao de alguma atividade do cotidiano?": "Você tem problemas de audição capazes de impedir a realização de alguma atividade do cotidiano? (É permitido o uso de aparelhos de audição.)  ",
    "voce tem alguma das tres condicoes? (polipatologia, polifarmacia, internacao recente)": "Você tem alguma das três condições abaixo relacionadas?"
};

const CLASSIFICATION = {
    "ROBUSTO: Baixa vulnerabilidade clínico funcional": "Robusto",
    "FRÁGIL: alta vulnerabilidade clínico funcional": "Frágil",
    "PRÉ FRAGIL: moderada vulnerabilidade clínico funcional" : "Pré-Fragil"
}

const GENDER = {
    M: 'MALE',
    F: 'FEMALE',
    Masculino: 'MALE',
    Feminino: 'FEMALE',
}


// LOG
const log = (msg: string) => {
    const line = `[${new Date().toISOString()}] ${msg}`;
    console.log(line);
    fs.appendFileSync(LOG_FILE, line + "\n");
};

// NORMALIZAÇÃO
const normalize = (text: string) =>
    text
        ?.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim() || "";

const cleanStatement = (text: string) =>
    normalize(text.replace(/^\s*\d+\.\s*/, ""));

// EXCEL
const parseExcel = () => {
    const workbook = XLSX.readFile(FILE_PATH);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet, { defval: null });
    console.log(json.length)
    return json.slice(START_ROW - 1, END_ROW ?? undefined);
};

const excelDateToJSDate = (serial: number) => {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30)); // correção do bug do Excel
    return new Date(excelEpoch.getTime() + serial * 86400000);
};

// CSV
const loadQuestionMap = () => {
    const file = fs.readFileSync("./question.csv");

    const records = parse(file, {
        columns: true,
        skip_empty_lines: true,
    });

    const map = new Map<string, string>();

    for (const r of records) {
        const raw = r as any;
        map.set(cleanStatement(raw.statement), raw.id);
    }

    return map;
};

// OPTION
const findOption = (question: any, value: string) => {
    const valNorm = normalize(value);

    // 1. match exato
    let option = question.options.find((opt: any) =>
        normalize(opt.label) === valNorm
    );

    if (option) return option;

    // 2. match por inclusão (🔥 resolve seu caso)
    option = question.options.find((opt: any) =>
        valNorm.includes(normalize(opt.label))
    );

    if (option) return option;

    // 3. fallback especial (custom)
    // exemplo: tratar "não ..." como "não"
    if (valNorm.startsWith("nao")) {
        option = question.options.find((opt: any) =>
            normalize(opt.label) === "nao"
        );
        if (option) return option;
    }

    return null;
};

// PARTICIPANTE
const createParticipant = async (tx: PrismaClient, row: any) => {
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

    const userExist = await tx.user.findUnique({
        where: { email }
    })

    if (userExist) {
        userId = userExist.id;
    } else {
        const user = await tx.user.create({
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

    const participantExist = await tx.participant.findFirst({
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
        const participant = await tx.participant.create({
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


    const professionalParticipantExist = await tx.healthProfessionalParticipant.findFirst({
        where: {
            participantId,
            healthProfessionalId: HEALTH_PROFESSIONAL_ID,
        }
    })

    if (!professionalParticipantExist) {
        await tx.healthProfessionalParticipant.create({
            data: {
                healthProfessionalId: HEALTH_PROFESSIONAL_ID,
                participantId: participantId,
            },
        });
    }

    return participantId;
};

// RUN
const run = async () => {
    await debugConnection();
    log("🚀 MODO: RUN");

    const rows = parseExcel();
    const questionMap = loadQuestionMap();

    const excelColumns = new Set(
        Object.keys(rows[0] || {}).map(cleanStatement)
    );

    const missingInExcel: string[] = [];
    const validQuestions: string[] = [];

    for (const question of questionMap.keys()) {
        console.log(question)
        if (!excelColumns.has(question)) {
            const escape = ANSWERS_ALIASES[question]
            if (!excelColumns.has(cleanStatement(escape))) {
                missingInExcel.push(question);
            } else {
                validQuestions.push(cleanStatement(escape));
            }
        } else {
            validQuestions.push(question);
        }
    }

    if (missingInExcel.length) {
        log(`❌ Perguntas do CSV que NÃO estão no Excel: ${missingInExcel.length}`);
        missingInExcel.forEach(q => log(`   - ${q}`));

        throw new Error("Perguntas do CSV NÃO estão no Excel")
    }

    const questionnaire = await prisma.questionnaire.findUnique({
        where: { slug: QUESTIONNAIRE_SLUG },
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

    if (!questionnaire) throw new Error("Questionário não encontrado");

    const questions = [
        ...questionnaire.groups.flatMap(g => g.questions),
        ...questionnaire.groups.flatMap(g =>
            g.subGroups.flatMap(sg => sg.questions)
        ),
    ];

    log(`📊 Linhas: ${rows.length}`);

    const validQuestionColumns = new Set(
        validQuestions
    );

    // VALIDAÇÃO
    for (const row of rows as any[]) {
        for (const column of Object.keys(row)) {
            const normalizedColumn = cleanStatement(column);

            // ignora colunas que NÃO são perguntas
            if (!validQuestionColumns.has(normalizedColumn)) {
                console.log("Ignorando coluna:", column);
                continue;
            }

            // só valida se tiver valor
            if (!row[column]) {
                console.log("Ignorando coluna sem valor:", column);
                continue;
            }

            if (!questionMap.has(normalizedColumn)) {
                if (normalizedColumn in ANSWERS_ALIASES) {
                    //TODO aqui verificar se o normalized não está no aliases de ANSWERS
                }
                throw new Error(`❌ Coluna sem match: ${column}`);
            }
        }
    }

    log("✅ Validação OK");

    let success = 0;

    await prisma.$transaction(async (tx) => {
        for (const row of rows as any[]) {
            const name = row['Nome:'];
            const expectedQuestions = new Set(questionMap.keys());
            const answeredQuestions = new Set<string>();

            try {
                if (!name) {
                    console.log("Sem nome")
                    continue
                }

                const participantId = await createParticipant(tx as PrismaClient, row);

                if (!participantId) {
                    throw new Error("Participante não encontrado")
                }

                const response = await tx.questionnaireResponse.create({
                    data: {
                        participantId,
                        healthProfessionalId: HEALTH_PROFESSIONAL_ID,
                        questionnaireId: questionnaire.id,
                        totalScore: Number(row['Cálculo'] || 0),
                        classification: CLASSIFICATION[row['Resultado']] || null,
                    },
                });

                for (const column of Object.keys(row)) {
                    const value = row[column];
                    if (!value) {
                        console.log("Ignorando coluna sem valor:", column);
                        continue;
                    }

                    const normalizedColumn = cleanStatement(column);
                    answeredQuestions.add(normalizedColumn);

                    if (!questionMap.has(normalizedColumn)) {
                        console.log("Ignorando coluna sem match:", column);
                        continue; // 🔥 ignora colunas não mapeadas
                    }

                    const questionId = questionMap.get(cleanStatement(column));
                    const question = questions.find(q => q.id === questionId);

                    if (!question) {
                        throw new Error("Questão não encontrada")
                    }

                    let selectedOptionId = null;
                    let valueText: string | null = null;

                    if (question.type === "MULTIPLE_CHOICE") {
                        const option = findOption(question, value);

                        if (!option) {
                            throw new Error(`Option não encontrada: ${value}`);
                        }

                        selectedOptionId = option.id;
                    } else {
                        valueText = String(value);
                    }

                    await tx.answer.create({
                        data: {
                            questionnaireResponseId: response.id,
                            questionId: question.id,
                            selectedOptionId,
                            valueText,
                        },
                    });
                }

                const missingAnswers: string[] = [];

                for (const q of expectedQuestions) {
                    if (!answeredQuestions.has(q)) {
                        missingAnswers.push(q);
                    }
                }

                if (missingAnswers.length) {
                    log(`⚠️ ${name} NÃO respondeu ${missingAnswers.length} perguntas`);

                    // opcional: detalhar
                    missingAnswers.forEach(q => log(`   - ${q}`));
                }

                success++;
                log(`✅ ${name}`);
            } catch (err: any) {
                log(`❌ ERRO em ${name}: ${err.message}`);
                throw err; // 🔥 aborta tudo
            }
        }
    }, { timeout: 60000 });

    if (DRY_RUN) {
        throw new Error("🧪 DRY RUN - rollback intencional");
    }

    log(`🎉 FINALIZADO - Sucesso: ${success}`);
};

// ROLLBACK
const rollback = async () => {
    log("🧹 MODO: ROLLBACK");

    const participants = await prisma.participant.findMany({
        where: {
            healthProfessionalsLinks: {
                some: {
                    healthProfessionalId: HEALTH_PROFESSIONAL_ID,
                },
            },
        },
        select: { id: true },
    });

    const ids = participants.map(p => p.id);

    log(`🧹 Limpando ${ids.length} participantes`);

    await prisma.answer.deleteMany({
        where: {
            questionnaireResponse: {
                participantId: { in: ids },
            },
        },
    });

    await prisma.questionnaireResponse.deleteMany({
        where: {
            participantId: { in: ids },
        },
    });

    await prisma.healthProfessionalParticipant.deleteMany({
        where: {
            participantId: { in: ids },
        },
    });

    await prisma.participant.deleteMany({
        where: {
            id: { in: ids },
        },
    });

    log("✅ ROLLBACK FINALIZADO");
};

const debugConnection = async () => {
    const result = await prisma.$queryRawUnsafe<any[]>(`
        SELECT 
            current_database() as database,
            current_schema() as schema,
            inet_server_addr() as host,
            inet_server_port() as port
    `);

    console.log("🧠 CONEXÃO REAL:");
    console.table(result);
};

// ENTRYPOINT
const mode = process.argv[2];

fs.writeFileSync(LOG_FILE, ""); // limpa log

if (mode === "rollback") {
    rollback().catch(err => {
        log(`💥 ERRO ROLLBACK: ${err.message}`);
        process.exit(1);
    });
} else {
    run().catch(err => {
        log(`💥 ERRO RUN: ${err.message}`);
        process.exit(1);
    });
}