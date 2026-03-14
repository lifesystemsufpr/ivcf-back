import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "src/shared/prisma/prisma.service";
import { Gender, Prisma } from "@prisma/client";
import {
  AgeDistributionResponse,
  AgeVsFragilityResponse,
  AverageAgeResponse,
  AverageScoreResponse,
  DomainHeatmapResponse,
  DomainPerformanceResponse,
  RiskDistributionResponse,
  RiskPyramidResponse,
  TotalParticipantsResponse,
} from "./interfaces/dashboard.interface";
import { DashboardFilterDto } from "./dto/dashboard-filter.dto";

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  private calculateAge(birthday: Date): number {
    const ageDifMs = Date.now() - birthday.getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  }

  async getTotalParticipants(
    filters: DashboardFilterDto,
  ): Promise<TotalParticipantsResponse> {
    try {
      const { gender, minAge, maxAge, riskClassification } = filters;

      const whereClause: Prisma.ParticipantWhereInput = {
        active: true,
      };

      if (gender) {
        whereClause.user = {
          gender: gender,
        };
      }

      if (minAge !== undefined || maxAge !== undefined) {
        const today = new Date();
        const birthdayFilter: Prisma.DateTimeFilter = {};

        if (minAge !== undefined) {
          birthdayFilter.lte = new Date(
            today.getFullYear() - minAge,
            today.getMonth(),
            today.getDate(),
          );
        }

        if (maxAge !== undefined) {
          birthdayFilter.gte = new Date(
            today.getFullYear() - maxAge - 1,
            today.getMonth(),
            today.getDate() + 1,
          );
        }

        whereClause.birthday = birthdayFilter;
      }

      if (riskClassification) {
        whereClause.questionnaireResponses = {
          some: {
            classification: riskClassification,
          },
        };
      }

      const total = await this.prisma.participant.count({
        where: whereClause,
      });

      return { totalParticipantes: total };
    } catch (error) {
      this.logger.error("Error calculating filtered total participants", error);
      throw new InternalServerErrorException(
        "Failed to process total participants",
      );
    }
  }

  async getAverageScore(): Promise<AverageScoreResponse> {
    try {
      const result = await this.prisma.questionnaireResponse.aggregate({
        _avg: { totalScore: true },
        _count: { id: true },
      });

      return {
        averageScore: Number(result._avg.totalScore?.toFixed(2)) || 0,
        totalAssessments: result._count.id || 0,
      };
    } catch (error) {
      this.logger.error("Error calculating average score", error);
      throw new InternalServerErrorException("Failed to process average score");
    }
  }

  async getAverageAge(): Promise<AverageAgeResponse> {
    try {
      const participants = await this.prisma.participant.findMany({
        select: { birthday: true },
        where: { active: true },
      });

      if (!participants.length) return { averageAge: 0 };

      const totalAge = participants.reduce(
        (sum, p) => sum + this.calculateAge(p.birthday),
        0,
      );

      return {
        averageAge: Math.round(totalAge / participants.length),
      };
    } catch (error) {
      this.logger.error("Error calculating average age", error);
      throw new InternalServerErrorException("Failed to process average age");
    }
  }

  async getAgeDistribution(): Promise<AgeDistributionResponse[]> {
    try {
      const participants = await this.prisma.participant.findMany({
        select: { birthday: true },
        where: { active: true },
      });

      const distribution = {
        "60-69": 0,
        "70-79": 0,
        "80+": 0,
        Others: 0,
      };

      participants.forEach((p) => {
        const age = this.calculateAge(p.birthday);
        if (age >= 60 && age <= 69) distribution["60-69"]++;
        else if (age >= 70 && age <= 79) distribution["70-79"]++;
        else if (age >= 80) distribution["80+"]++;
        else distribution["Others"]++;
      });

      return Object.entries(distribution)
        .filter(([range]) => range !== "Others")
        .map(([range, total]) => ({ range, total }));
    } catch (error) {
      this.logger.error("Error calculating age distribution", error);
      throw new InternalServerErrorException(
        "Failed to process age distribution",
      );
    }
  }

  async getRiskDistribution(): Promise<RiskDistributionResponse[]> {
    try {
      const distribution = await this.prisma.questionnaireResponse.groupBy({
        by: ["classification"],
        _count: { id: true },
      });

      return distribution
        .filter((d) => d.classification !== null)
        .map((d) => ({
          risk: d.classification as string,
          total: d._count.id,
        }));
    } catch (error) {
      this.logger.error("Error calculating risk distribution", error);
      throw new InternalServerErrorException(
        "Failed to process risk distribution",
      );
    }
  }

  async getRiskPyramid(): Promise<RiskPyramidResponse[]> {
    try {
      const responses = await this.prisma.questionnaireResponse.findMany({
        where: { classification: { not: null } },
        select: {
          classification: true,
          participant: {
            select: { user: { select: { gender: true } } },
          },
        },
      });

      const pyramidMap = new Map<string, RiskPyramidResponse>();

      responses.forEach((res) => {
        const risk = res.classification as string;
        const gender = res.participant.user.gender;

        if (!pyramidMap.has(risk)) {
          pyramidMap.set(risk, { risk, male: 0, female: 0, others: 0 });
        }

        const data = pyramidMap.get(risk)!;

        if (gender === Gender.MALE) data.male++;
        else if (gender === Gender.FEMALE) data.female++;
        else data.others++;
      });

      return Array.from(pyramidMap.values());
    } catch (error) {
      this.logger.error("Error building risk pyramid", error);
      throw new InternalServerErrorException("Failed to process risk pyramid");
    }
  }

  async getAgeVsFragility(): Promise<AgeVsFragilityResponse[]> {
    try {
      const responses = await this.prisma.questionnaireResponse.findMany({
        select: {
          totalScore: true,
          participant: { select: { birthday: true } },
        },
      });

      return responses.map((res) => ({
        age: this.calculateAge(res.participant.birthday),
        fragility: res.totalScore,
      }));
    } catch (error) {
      this.logger.error("Error fetching age vs fragility data", error);
      throw new InternalServerErrorException(
        "Failed to process fragility correlation",
      );
    }
  }

  async getDomainPerformanceOverview(): Promise<DomainPerformanceResponse[]> {
    try {
      const responses = await this.prisma.questionnaireResponse.findMany({
        select: {
          participantId: true,
          answers: {
            select: {
              selectedOption: { select: { score: true } },
              question: { select: { group: { select: { title: true } } } },
            },
          },
        },
      });

      const domainStats = new Map<
        string,
        { totalScore: number; participants: Set<string> }
      >();

      responses.forEach((response) => {
        response.answers.forEach((answer) => {
          const domain = answer.question.group?.title;
          const score = answer.selectedOption?.score || 0;

          if (!domain) return;

          if (!domainStats.has(domain)) {
            domainStats.set(domain, { totalScore: 0, participants: new Set() });
          }

          const stats = domainStats.get(domain)!;
          stats.totalScore += score;
          stats.participants.add(response.participantId);
        });
      });

      return Array.from(domainStats.entries()).map(([domain, stats]) => ({
        domain,
        average: Number(
          (stats.totalScore / stats.participants.size).toFixed(2),
        ),
        evaluatedParticipants: stats.participants.size,
      }));
    } catch (error) {
      this.logger.error("Error calculating domain performance", error);
      throw new InternalServerErrorException("Failed to process domain data");
    }
  }

  async getDomainHeatmap(): Promise<DomainHeatmapResponse[]> {
    try {
      const responses = await this.prisma.questionnaireResponse.findMany({
        select: {
          participant: { select: { user: { select: { gender: true } } } },
          answers: {
            select: {
              selectedOption: { select: { score: true } },
              question: { select: { group: { select: { title: true } } } },
            },
          },
        },
      });

      const domainMap = new Map<
        string,
        {
          maleScore: number;
          maleCount: number;
          femaleScore: number;
          femaleCount: number;
          otherScore: number;
          otherCount: number;
        }
      >();

      responses.forEach((response) => {
        const gender = response.participant.user.gender;

        response.answers.forEach((answer) => {
          const domain = answer.question.group?.title;
          const score = answer.selectedOption?.score || 0;

          if (!domain) return;

          if (!domainMap.has(domain)) {
            domainMap.set(domain, {
              maleScore: 0,
              maleCount: 0,
              femaleScore: 0,
              femaleCount: 0,
              otherScore: 0,
              otherCount: 0,
            });
          }

          const stats = domainMap.get(domain)!;

          if (gender === Gender.MALE) {
            stats.maleScore += score;
            stats.maleCount++;
          } else if (gender === Gender.FEMALE) {
            stats.femaleScore += score;
            stats.femaleCount++;
          } else {
            stats.otherScore += score;
            stats.otherCount++;
          }
        });
      });

      return Array.from(domainMap.entries()).map(([domain, stats]) => ({
        domain,
        male: stats.maleCount
          ? Number((stats.maleScore / stats.maleCount).toFixed(2))
          : 0,
        female: stats.femaleCount
          ? Number((stats.femaleScore / stats.femaleCount).toFixed(2))
          : 0,
        others: stats.otherCount
          ? Number((stats.otherScore / stats.otherCount).toFixed(2))
          : 0,
      }));
    } catch (error) {
      this.logger.error("Error building domain heatmap", error);
      throw new InternalServerErrorException("Failed to process heatmap");
    }
  }
}
