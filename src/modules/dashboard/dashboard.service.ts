import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { DashboardRepository } from "./dashboard.repository";
import {
  TotalParticipantsResponse,
  AverageScoreResponse,
  AverageAgeResponse,
  AgeDistributionResponse,
  RiskDistributionResponse,
  RiskPyramidResponse,
  AgeVsFragilityResponse,
  DomainPerformanceResponse,
  DomainHeatmapResponse,
} from "./interfaces/dashboard.interface";
import { DashboardFilterDto } from "./dto/dashboard-filter.dto";

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly dashboardRepository: DashboardRepository) {}

  async getTotalParticipants(
    filters: DashboardFilterDto,
  ): Promise<TotalParticipantsResponse> {
    try {
      const result =
        await this.dashboardRepository.getTotalParticipants(filters);
      return { totalParticipantes: Number(result[0]?.total || 0) };
    } catch (error) {
      this.logger.error("Error calculating filtered total participants", error);
      throw new InternalServerErrorException(
        "Failed to process total participants",
      );
    }
  }

  async getAverageScore(
    filters: DashboardFilterDto,
  ): Promise<AverageScoreResponse> {
    try {
      const result = await this.dashboardRepository.getAverageScore(filters);
      return {
        averageScore: result[0]?.averageScore
          ? Number(Number(result[0].averageScore).toFixed(2))
          : 0,
        totalAssessments: Number(result[0]?.totalAssessments || 0),
      };
    } catch (error) {
      this.logger.error("Error calculating average score", error);
      throw new InternalServerErrorException("Failed to process average score");
    }
  }

  async getAverageAge(
    filters: DashboardFilterDto,
  ): Promise<AverageAgeResponse> {
    try {
      const result = await this.dashboardRepository.getAverageAge(filters);
      return {
        averageAge: result[0]?.averageAge
          ? Math.round(Number(result[0].averageAge))
          : 0,
      };
    } catch (error) {
      this.logger.error("Error calculating average age", error);
      throw new InternalServerErrorException("Failed to process average age");
    }
  }

  async getAgeDistribution(
    filters: DashboardFilterDto,
  ): Promise<AgeDistributionResponse[]> {
    try {
      const result = await this.dashboardRepository.getAgeDistribution(filters);

      const defaultDistribution = {
        "60-69": 0,
        "70-79": 0,
        "80+": 0,
      };

      result.forEach((row) => {
        if (row.range !== "Others") {
          defaultDistribution[row.range as keyof typeof defaultDistribution] =
            Number(row.total);
        }
      });

      return Object.entries(defaultDistribution).map(([range, total]) => ({
        range,
        total,
      }));
    } catch (error) {
      this.logger.error("Error calculating age distribution", error);
      throw new InternalServerErrorException(
        "Failed to process age distribution",
      );
    }
  }

  async getRiskDistribution(
    filters: DashboardFilterDto,
  ): Promise<RiskDistributionResponse[]> {
    try {
      const result =
        await this.dashboardRepository.getRiskDistribution(filters);
      return result.map((d) => ({
        risk: d.risk,
        total: Number(d.total),
      }));
    } catch (error) {
      this.logger.error(
        "Error calculating risk distribution",
        (error as Error).stack || (error as Error).message || String(error),
      );
      throw new InternalServerErrorException(
        "Failed to process risk distribution",
      );
    }
  }

  async getRiskPyramid(
    filters: DashboardFilterDto,
  ): Promise<RiskPyramidResponse[]> {
    try {
      const result = await this.dashboardRepository.getRiskPyramid(filters);
      return result.map((row) => ({
        risk: row.risk,
        male: Number(row.male),
        female: Number(row.female),
        others: Number(row.others),
      }));
    } catch (error) {
      this.logger.error(
        "Error building risk pyramid",
        (error as Error).stack || (error as Error).message || String(error),
      );
      throw new InternalServerErrorException("Failed to process risk pyramid");
    }
  }

  async getAgeVsFragility(
    filters: DashboardFilterDto,
  ): Promise<AgeVsFragilityResponse[]> {
    try {
      const result = await this.dashboardRepository.getAgeVsFragility(filters);
      return result.map((row) => ({
        age: Number(row.age),
        fragility: Number(row.fragility),
      }));
    } catch (error) {
      this.logger.error(
        "Error fetching age vs fragility data",
        (error as Error).stack || (error as Error).message || String(error),
      );
      throw new InternalServerErrorException(
        "Failed to process fragility correlation",
      );
    }
  }

  async getDomainPerformanceOverview(
    filters: DashboardFilterDto,
  ): Promise<DomainPerformanceResponse[]> {
    try {
      const result =
        await this.dashboardRepository.getDomainPerformanceOverview(filters);
      return result.map((row) => ({
        domain: String(row.domain),
        average: Number(Number(row.average).toFixed(2)),
        evaluatedParticipants: Number(row.evaluatedParticipants),
      }));
    } catch (error) {
      this.logger.error(
        "Error calculating domain performance",
        (error as Error).stack || (error as Error).message || String(error),
      );
      throw new InternalServerErrorException("Failed to process domain data");
    }
  }

  async getDomainHeatmap(
    filters: DashboardFilterDto,
  ): Promise<DomainHeatmapResponse[]> {
    try {
      const result = await this.dashboardRepository.getDomainHeatmap(filters);
      return result.map((row) => ({
        domain: String(row.domain),
        male: Number(Number(row.male).toFixed(2)),
        female: Number(Number(row.female).toFixed(2)),
        others: Number(Number(row.others).toFixed(2)),
      }));
    } catch (error) {
      this.logger.error(
        "Error building domain heatmap",
        (error as Error).stack || (error as Error).message || String(error),
      );
      throw new InternalServerErrorException("Failed to process heatmap");
    }
  }
}
