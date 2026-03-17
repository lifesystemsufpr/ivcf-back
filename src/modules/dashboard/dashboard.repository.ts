import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/prisma/prisma.service";
import { Prisma } from "@prisma/client";
import { DashboardFilterDto } from "./dto/dashboard-filter.dto";

@Injectable()
export class DashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  private buildRawFilters(filters: DashboardFilterDto): Prisma.Sql {
    if (!filters) return Prisma.empty;

    const conditions: Prisma.Sql[] = [];

    if (filters.gender) {
      conditions.push(
        Prisma.sql`u.gender = CAST(${filters.gender} AS "Gender")`,
      );
    }

    if (filters.minAge !== undefined) {
      const minDate = new Date();
      minDate.setFullYear(minDate.getFullYear() - filters.minAge);
      conditions.push(Prisma.sql`p.birthday <= ${minDate}`);
    }

    if (filters.maxAge !== undefined) {
      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() - filters.maxAge - 1);
      conditions.push(Prisma.sql`p.birthday > ${maxDate}`);
    }

    if (filters.riskClassification) {
      conditions.push(
        Prisma.sql`qr.classification = ${filters.riskClassification}`,
      );
    }

    return conditions.length > 0
      ? Prisma.sql` AND ${Prisma.join(conditions, " AND ")}`
      : Prisma.empty;
  }

  async getTotalParticipants(filters: DashboardFilterDto) {
    const conditions = this.buildRawFilters(filters);
    return this.prisma.$queryRaw<{ total: number | bigint }[]>`
      SELECT COUNT(DISTINCT p.id)::int as total
      FROM "participant" p
      JOIN "user" u ON p.id = u.id
      JOIN "questionnaire_response" qr ON qr."participantId" = p.id
      WHERE p.active = true ${conditions};
    `;
  }

  async getAverageScore(filters: DashboardFilterDto) {
    const conditions = this.buildRawFilters(filters);
    return this.prisma.$queryRaw<
      { averageScore: number | null; totalAssessments: number | bigint }[]
    >`
      SELECT 
        AVG(qr."totalScore") as "averageScore",
        COUNT(qr.id)::int as "totalAssessments"
      FROM "questionnaire_response" qr
      JOIN "participant" p ON qr."participantId" = p.id
      JOIN "user" u ON p.id = u.id
      WHERE p.active = true ${conditions};
    `;
  }

  async getAverageAge(filters: DashboardFilterDto) {
    const conditions = this.buildRawFilters(filters);
    return this.prisma.$queryRaw<{ averageAge: number | null }[]>`
      WITH FilteredParticipants AS (
        SELECT DISTINCT p.id, p.birthday
        FROM "participant" p
        JOIN "user" u ON p.id = u.id
        JOIN "questionnaire_response" qr ON qr."participantId" = p.id
        WHERE p.active = true ${conditions}
      )
      SELECT AVG(EXTRACT(YEAR FROM age(CURRENT_DATE, birthday))) as "averageAge"
      FROM FilteredParticipants;
    `;
  }

  async getAgeDistribution(filters: DashboardFilterDto) {
    const conditions = this.buildRawFilters(filters);
    return this.prisma.$queryRaw<{ range: string; total: number | bigint }[]>`
      WITH FilteredParticipants AS (
        SELECT DISTINCT p.id, EXTRACT(YEAR FROM age(CURRENT_DATE, p.birthday))::int as age
        FROM "participant" p
        JOIN "user" u ON p.id = u.id
        JOIN "questionnaire_response" qr ON qr."participantId" = p.id
        WHERE p.active = true ${conditions}
      )
      SELECT 
        CASE 
          WHEN age BETWEEN 60 AND 69 THEN '60-69'
          WHEN age BETWEEN 70 AND 79 THEN '70-79'
          WHEN age >= 80 THEN '80+'
          ELSE 'Others'
        END as range,
        COUNT(*)::int as total
      FROM FilteredParticipants
      GROUP BY range;
    `;
  }

  async getRiskDistribution(filters: DashboardFilterDto) {
    const conditions = this.buildRawFilters(filters);
    return this.prisma.$queryRaw<{ risk: string; total: number | bigint }[]>`
      SELECT qr.classification as risk, COUNT(qr.id)::int as total
      FROM "questionnaire_response" qr
      JOIN "participant" p ON qr."participantId" = p.id
      JOIN "user" u ON p.id = u.id
      WHERE p.active = true AND qr.classification IS NOT NULL ${conditions}
      GROUP BY qr.classification;
    `;
  }

  async getRiskPyramid(filters: DashboardFilterDto) {
    const conditions = this.buildRawFilters(filters);
    return this.prisma.$queryRaw<
      {
        risk: string;
        male: number | bigint;
        female: number | bigint;
        others: number | bigint;
      }[]
    >`
      SELECT 
          qr.classification as risk,
          COUNT(CASE WHEN u.gender = 'MALE' THEN 1 END)::int as male,
          COUNT(CASE WHEN u.gender = 'FEMALE' THEN 1 END)::int as female,
          COUNT(CASE WHEN u.gender NOT IN ('MALE', 'FEMALE') OR u.gender IS NULL THEN 1 END)::int as others
      FROM "questionnaire_response" qr
      JOIN "participant" p ON qr."participantId" = p.id
      JOIN "user" u ON p.id = u.id
      WHERE p.active = true AND qr.classification IS NOT NULL ${conditions}
      GROUP BY qr.classification;
    `;
  }

  async getAgeVsFragility(filters: DashboardFilterDto) {
    const conditions = this.buildRawFilters(filters);
    return this.prisma.$queryRaw<{ age: number; fragility: number }[]>`
      SELECT 
          EXTRACT(YEAR FROM age(CURRENT_DATE, p.birthday))::int as age,
          qr."totalScore" as fragility
      FROM "questionnaire_response" qr
      JOIN "participant" p ON qr."participantId" = p.id
      JOIN "user" u ON p.id = u.id
      WHERE p.active = true ${conditions};
    `;
  }

  async getDomainPerformanceOverview(filters: DashboardFilterDto) {
    const conditions = this.buildRawFilters(filters);
    return this.prisma.$queryRaw<
      {
        domain: string;
        average: number;
        evaluatedParticipants: number | bigint;
      }[]
    >`
      SELECT 
          COALESCE(qg.title, qg_sub.title) as domain,
          (SUM(qo.score)::float / COUNT(DISTINCT qr."participantId")) as average,
          COUNT(DISTINCT qr."participantId")::int as "evaluatedParticipants"
      FROM "questionnaire_response" qr
      JOIN "participant" p ON qr."participantId" = p.id
      JOIN "user" u ON p.id = u.id
      JOIN "answer" a ON a."questionnaireResponseId" = qr.id
      JOIN "question_option" qo ON a."selectedOptionId" = qo.id
      JOIN "question" q ON a."questionId" = q.id
      LEFT JOIN "question_group" qg ON q."groupId" = qg.id
      LEFT JOIN "question_subgroup" qs ON q."subGroupId" = qs.id
      LEFT JOIN "question_group" qg_sub ON qs."groupId" = qg_sub.id
      WHERE p.active = true AND COALESCE(qg.title, qg_sub.title) IS NOT NULL ${conditions}
      GROUP BY COALESCE(qg.title, qg_sub.title);
    `;
  }

  async getDomainHeatmap(filters: DashboardFilterDto) {
    const conditions = this.buildRawFilters(filters);
    return this.prisma.$queryRaw<
      { domain: string; male: number; female: number; others: number }[]
    >`
      WITH ResponseDomainScores AS (
          SELECT 
              qr."participantId",
              u.gender,
              COALESCE(qg.title, qg_sub.title) as domain,
              SUM(qo.score) as score
          FROM "questionnaire_response" qr
          JOIN "participant" p ON qr."participantId" = p.id
          JOIN "user" u ON p.id = u.id
          JOIN "answer" a ON a."questionnaireResponseId" = qr.id
          JOIN "question_option" qo ON a."selectedOptionId" = qo.id
          JOIN "question" q ON a."questionId" = q.id
          LEFT JOIN "question_group" qg ON q."groupId" = qg.id
          LEFT JOIN "question_subgroup" qs ON q."subGroupId" = qs.id
          LEFT JOIN "question_group" qg_sub ON qs."groupId" = qg_sub.id
          WHERE p.active = true AND COALESCE(qg.title, qg_sub.title) IS NOT NULL ${conditions}
          GROUP BY qr.id, qr."participantId", u.gender, COALESCE(qg.title, qg_sub.title)
      )
      SELECT 
          domain,
          COALESCE(AVG(CASE WHEN gender = 'MALE' THEN score END), 0)::float as male,
          COALESCE(AVG(CASE WHEN gender = 'FEMALE' THEN score END), 0)::float as female,
          COALESCE(AVG(CASE WHEN gender NOT IN ('MALE', 'FEMALE') OR gender IS NULL THEN score END), 0)::float as others
      FROM ResponseDomainScores
      GROUP BY domain;
    `;
  }
}
