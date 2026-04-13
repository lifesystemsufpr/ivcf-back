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
const FILE_PATH = "C:\\Users\\danie\\Downloads/Coletas IVCF-20 Sofia.xlsx";
const LOG_FILE = "./import.log";

// RANGE
const START_ROW = 1;
const END_ROW = 116;

const DRY_RUN = process.argv.includes("--dry-run");

const EXCEL_ANSWERS_ALIASES: Record<string, string> = {
    "Por causa de sua saúde ou condição física, você deixou de controlar seu dinheiro, gasto ou pagar as contas de sua casa?" : "por causa de sua saude ou condicao fisica, voce deixou de controlar seu dinheiro?",
    "Por causa de sua saúde ou condição física, você deixou de realizar pequenos trabalhos domésticos, como lavar louça, arrumar a casa ou fazer limpeza leve?": "por causa de sua saude ou condicao fisica, voce deixou de realizar pequenos trabalhos domesticos?",
    "Você tem alguma das três condições abaixo relacionadas?  (FAZER MEDIDAS)": "voce tem alguma das quatro condicoes abaixo? (perda de peso, imc baixo, etc)",
    "Você tem problemas de visão capazes de impedir a realização de alguma atividade do cotidiano? (É permitido o uso de óculos ou lentes de contato.)   ": "voce tem problemas de visao capazes de impedir a realizacao de alguma atividade do cotidiano?",
    "Você tem problemas de audição capazes de impedir a realização de alguma atividade do cotidiano? (É permitido o uso de aparelhos de audição.)  ": "voce tem problemas de audicao capazes de impedir a realizacao de alguma atividade do cotidiano?",
    "Você tem alguma das três condições abaixo relacionadas?": "voce tem alguma das tres condicoes? (polipatologia, polifarmacia, internacao recente)"
}

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

const OPTION_ALIASES: Record<string, string> = {
    "Não": "Nenhuma",
    "nao": "Nenhuma",
    "uso regular de cinco ou mais medicamentos diferentes, todo dia" : "Uso de cinco ou mais medicamentos (polifarmácia)",
    "circunferencia (perimetro) da panturrilha a < 31cm": "Circunferência da panturrilha menor que 31 cm",
    "indice de massa corporal (imc) menor que 22kg/m2": "IMC menor que 22 kg/m²",
    "cinco ou mais doencas cronicas.": "Cinco ou mais doenças crônicas (polipatologia)",
    "tempo gasto no teste de velocidade da marcha (4m) > 5 segundos": "Tempo de marcha (4 m) maior que 5 segundos",
    "perda de peso nao intencional de 4,5kg ou 5% do peso corporal no ultimo ano ou 6kg nos ultimos 6 meses ou 3kg no ultimo mes": "Perda de peso maior que 4,5 kg no último ano",
    "internacao recente, nos ultimos seis meses.": "Internação hospitalar nos últimos 6 meses"
};

// OPTION
const findOption = (question: any, value: string) => {
    const valNorm = normalize(value);
    console.log(value)
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

    if (OPTION_ALIASES[valNorm]) {
        const alias = OPTION_ALIASES[valNorm];
        if (alias) {
            option = question.options.find((opt: any) =>
                normalize(opt.label).includes(alias)
            );
            if (option) return option;
        }
    }

    return null;
};

const findOptions = (question: any, value: string) => {
    const valNorm = normalize(value);

    // 🔥 quebra respostas múltiplas (vírgula, ponto e vírgula, " e ")
    const parts = valNorm
        .split(";")
        .map(p => p.trim())
        .filter(Boolean);

    const matchedOptions: any[] = [];

    for (const part of parts) {
        let option =
            // 1. exato
            question.options.find((opt: any) =>
                normalize(opt.label) === part
            ) ||
            // 2. includes
            question.options.find((opt: any) =>
                part.includes(normalize(opt.label))
            ) ||
            // 3. include reverse
            question.options.find((opt: any) =>
                normalize(opt.label).includes(part)
            ) ||
            // 3. fallback "não"
            (part.startsWith("nao")
                ? question.options.find((opt: any) =>
                    normalize(opt.label) === "nao"
                )
                : null);

        // 4. alias
        if (!option && OPTION_ALIASES[part]) {
            const alias = normalize(OPTION_ALIASES[part]);

            option = question.options.find((opt: any) =>
                normalize(opt.label).includes(alias)
            );
        }

        if (option) {
            matchedOptions.push(option);
        } else {
            console.log("⚠️ Option não encontrada (multi):", part);
        }
    }

    return matchedOptions;
};

const resolveQuestionKey = (
    column: string,
    questionMap: Map<string, string>
): string | null => {
    const normalizedColumn = cleanStatement(column);

    // 1. match exato
    if (questionMap.has(normalizedColumn)) {
        return normalizedColumn;
    }

    // 2. alias direto
    let alias: string | null = null;

    for (const key in EXCEL_ANSWERS_ALIASES) {
        if (
            column.includes(key) ||
            key.includes(column)
        ) {
            alias = EXCEL_ANSWERS_ALIASES[key];
            break;
        }
    }

    if (alias) {
        const aliasNormalized = cleanStatement(alias);

        if (questionMap.has(aliasNormalized)) {
            return aliasNormalized;
        }
    }

    // 3. match parcial (como você pediu)
    for (const key of questionMap.keys()) {
        if (
            normalizedColumn.includes(key) ||
            key.includes(normalizedColumn)
        ) {
            return key;
        }
    }

    // 4. alias + parcial
    if (alias) {
        const aliasNormalized = cleanStatement(alias);

        for (const key of questionMap.keys()) {
            if (
                aliasNormalized.includes(key) ||
                key.includes(aliasNormalized)
            ) {
                return key;
            }
        }
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

            //TODO: Aqui quero replicar para outros lugares que fazem a mesma verificação, e caso não encontre de primeira a pergunta faz um fallback na constant que criei
            const resolved = resolveQuestionKey(column, questionMap);

            if (!resolved) {
                throw new Error(`❌ Coluna sem match 1: ${column}`);
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

                    const resolved = resolveQuestionKey(column, questionMap);

                    if (!resolved) {
                        console.log("Ignorando coluna sem match 2:", column);
                        continue;
                    }

                    answeredQuestions.add(resolved);

                    const questionId = questionMap.get(resolved);
                    const question = questions.find(q => q.id === questionId);

                    if (!question) {
                        throw new Error("Questão não encontrada")
                    }

                    if (question.type === "MULTIPLE_CHOICE") {
                        const options = findOptions(question, value);

                        if (!options.length) {
                            throw new Error(`Option não encontrada: ${value} | para pergunta -> ${question.statement}`);
                        }

                        for (const opt of options) {
                            await tx.answer.create({
                                data: {
                                    questionnaireResponseId: response.id,
                                    questionId: question.id,
                                    selectedOptionId: opt.id,
                                    valueText: null,
                                },
                            });
                        }
                    } else {
                        await tx.answer.create({
                            data: {
                                questionnaireResponseId: response.id,
                                questionId: question.id,
                                selectedOptionId: null,
                                valueText: String(value),
                            },
                        });
                    }
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