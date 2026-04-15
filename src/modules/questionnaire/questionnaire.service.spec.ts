import { Test, TestingModule } from "@nestjs/testing";
import { QuestionnaireService } from "./questionnaire.service";
import { PrismaService } from "../../shared/prisma/prisma.service";

type Answer = {
  selectedOption: { score: number } | null;
  question: {
    id?: string;
    order?: number;
    group?: { order: number } | null;
    subGroup?: { group: { order: number } } | null;
  };
};

const answer = (
  groupOrder: number,
  questionOrder: number,
  score: number,
  opts: { questionId?: string; subGroup?: boolean } = {},
): Answer => {
  const questionId = opts.questionId ?? `q-${groupOrder}-${questionOrder}`;
  const question: Answer["question"] = { id: questionId, order: questionOrder };
  if (opts.subGroup) {
    question.subGroup = { group: { order: groupOrder } };
  } else {
    question.group = { order: groupOrder };
  }
  return { selectedOption: { score }, question };
};

describe("QuestionnaireService - IVCF scoring", () => {
  let service: QuestionnaireService;

  // Access private method via bracket notation.
  const compute = (answers: Answer[]) =>
    (service as unknown as {
      computeDomainsFromAnswers: (a: Answer[]) => {
        domains: Record<string, number>;
        totalScore: number;
      };
    }).computeDomainsFromAnswers(answers);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionnaireService,
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();
    service = module.get(QuestionnaireService);
  });

  describe("Cognition (group 5)", () => {
    it("Q7=Sim sums exactly 1 pt", () => {
      const { domains } = compute([answer(5, 7, 1)]);
      expect(domains.cognition).toBe(1);
    });

    it("Q8=Sim sums exactly 1 pt", () => {
      const { domains } = compute([answer(5, 8, 1)]);
      expect(domains.cognition).toBe(1);
    });

    it("Q9=Sim sums exactly 2 pts (not 4)", () => {
      const { domains } = compute([answer(5, 9, 2)]);
      expect(domains.cognition).toBe(2);
    });

    it("Q7+Q8+Q9 all Sim sums 4 pts", () => {
      const { domains } = compute([
        answer(5, 7, 1),
        answer(5, 8, 1),
        answer(5, 9, 2),
      ]);
      expect(domains.cognition).toBe(4);
    });
  });

  describe("Mood (group 6, cap 2)", () => {
    it("Q10=Sim sums exactly 2 pts", () => {
      const { domains } = compute([answer(6, 10, 2)]);
      expect(domains.mood).toBe(2);
    });

    it("Q10+Q11 both Sim is capped at 2 pts", () => {
      const { domains } = compute([answer(6, 10, 2), answer(6, 11, 2)]);
      expect(domains.mood).toBe(2);
    });

    it("Q10=Não does not score", () => {
      const { domains } = compute([answer(6, 10, 0)]);
      expect(domains.mood).toBe(0);
    });
  });

  describe("Mobility (group 7, subgroups)", () => {
    it("Reach/Grasp Q12+Q13=Sim sums 2 pts (1+1)", () => {
      const { domains } = compute([
        answer(7, 12, 1, { subGroup: true }),
        answer(7, 13, 1, { subGroup: true }),
      ]);
      expect(domains.mobility).toBe(2);
    });

    it("Q14 with multiple options selected caps at max (2 pts)", () => {
      const questionId = "q-7-14";
      const { domains } = compute([
        answer(7, 14, 2, { subGroup: true, questionId }),
        answer(7, 14, 2, { subGroup: true, questionId }),
        answer(7, 14, 2, { subGroup: true, questionId }),
      ]);
      expect(domains.mobility).toBe(2);
    });

    it("Gait Q15+Q16 both Sim sums 4 pts (2+2)", () => {
      const { domains } = compute([
        answer(7, 15, 2, { subGroup: true }),
        answer(7, 16, 2, { subGroup: true }),
      ]);
      expect(domains.mobility).toBe(4);
    });

    it("Continence Q17=Sim sums 2 pts", () => {
      const { domains } = compute([answer(7, 17, 2, { subGroup: true })]);
      expect(domains.mobility).toBe(2);
    });
  });

  describe("Group caps", () => {
    it("AVD Instrumental (group 3) caps at 4 pts", () => {
      const { domains } = compute([
        answer(3, 3, 4),
        answer(3, 4, 4),
        answer(3, 5, 4),
      ]);
      expect(domains.functionalCapacity).toBe(4);
    });

    it("Comorbidities (group 9) caps at 4 pts via multi-select", () => {
      const questionId = "q-9-20";
      const { domains } = compute([
        answer(9, 20, 4, { questionId }),
        answer(9, 20, 4, { questionId }),
      ]);
      expect(domains.comorbidities).toBe(4);
    });
  });

  describe("Risk classification", () => {
    const classify = (score: number) =>
      (service as unknown as {
        classifyResponseRisk: (s: number) => string;
      }).classifyResponseRisk(score);

    it("<7 is Robusto", () => {
      expect(classify(0)).toBe("Robusto");
      expect(classify(6)).toBe("Robusto");
    });

    it("7-14 is Pré-Fragil", () => {
      expect(classify(7)).toBe("Pré-Fragil");
      expect(classify(14)).toBe("Pré-Fragil");
    });

    it(">=15 is Frágil", () => {
      expect(classify(15)).toBe("Frágil");
      expect(classify(40)).toBe("Frágil");
    });
  });
});
