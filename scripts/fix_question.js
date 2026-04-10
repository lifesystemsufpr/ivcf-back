import {Pool} from "pg";
import {PrismaPg} from "@prisma/adapter-pg";
import {PrismaClient} from "@prisma/client";

const connectionString = 'postgresql://ivcf_manager:Cv927KuVLHsP1Kh767rM8t@localhost:5432/ivcf';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

const fixQuestion14 = async () => {
    const questionOptions14 = await prisma.questionOption.findMany({
        where: {
            questionId: '44b25653-f279-4064-9e11-2fd1171eaa72'
        }
    })

    if (questionOptions14.length > 0) {
        await prisma.questionOption.deleteMany({
            where: {
                questionId: '44b25653-f279-4064-9e11-2fd1171eaa72'
            }
        })

        await prisma.questionOption.createMany({
            data: [
                {
                    label: 'Perda de peso maior que 4,5 kg no último ano',
                    score: 2,
                    order: 1,
                    questionId: '44b25653-f279-4064-9e11-2fd1171eaa72'
                },
                { label: 'IMC menor que 22 kg/m²', score: 2, order: 2, questionId: '44b25653-f279-4064-9e11-2fd1171eaa72' },
                {
                    label: 'Circunferência da panturrilha menor que 31 cm',
                    score: 2,
                    order: 3,
                    questionId: '44b25653-f279-4064-9e11-2fd1171eaa72'
                },
                {
                    label: 'Tempo de marcha (4 m) maior que 5 segundos',
                    score: 2,
                    order: 4,
                    questionId: '44b25653-f279-4064-9e11-2fd1171eaa72'
                },
                { label: 'Nenhuma das condições', score: 0, order: 5, questionId: '44b25653-f279-4064-9e11-2fd1171eaa72' }
            ]
        })
    }
};


const fixQuestion20 = async () => {
    const questionOptions20 = await prisma.questionOption.findMany({
        where: {
            questionId: 'b131722c-c18d-4aa6-9f7a-bee715fcabcf'
        }
    })

    if (questionOptions20.length > 0) {
        await prisma.questionOption.deleteMany({
            where: {
                questionId: 'b131722c-c18d-4aa6-9f7a-bee715fcabcf'
            }
        })

        await prisma.questionOption.createMany({
            data: [
                {
                    label: 'Cinco ou mais doenças crônicas (polipatologia)',
                    score: 4,
                    order: 1,
                    questionId: 'b131722c-c18d-4aa6-9f7a-bee715fcabcf'
                },
                {
                    label: 'Uso de cinco ou mais medicamentos (polifarmácia)',
                    score: 4,
                    order: 2,
                    questionId: 'b131722c-c18d-4aa6-9f7a-bee715fcabcf'
                },
                {
                    label: 'Internação hospitalar nos últimos 6 meses',
                    score: 4,
                    order: 3,
                    questionId: 'b131722c-c18d-4aa6-9f7a-bee715fcabcf'
                },
                { label: 'Nenhuma das condições', score: 0, order: 4, questionId: 'b131722c-c18d-4aa6-9f7a-bee715fcabcf' }
            ]
        })
    }
}

const run = async () => {
    await fixQuestion14();
    await fixQuestion20();
};

run();