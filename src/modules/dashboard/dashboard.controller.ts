import { Controller, Get, HttpCode, HttpStatus, Query } from "@nestjs/common";
import { DashboardService } from "./dashboard.service";
import { DashboardFilterDto } from "./dto/dashboard-filter.dto";

@Controller("dashboard")
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get("total-participants")
  @HttpCode(HttpStatus.OK)
  async getTotalParticipants(@Query() filters: DashboardFilterDto) {
    return await this.dashboardService.getTotalParticipants(filters);
  }

  @Get("average-score")
  @HttpCode(HttpStatus.OK)
  async getAverageScore() {
    return await this.dashboardService.getAverageScore();
  }

  @Get("average-age")
  @HttpCode(HttpStatus.OK)
  async getAverageAge() {
    return await this.dashboardService.getAverageAge();
  }

  @Get("age-distribution")
  @HttpCode(HttpStatus.OK)
  async getAgeDistribution() {
    return await this.dashboardService.getAgeDistribution();
  }

  @Get("risk-distribution")
  @HttpCode(HttpStatus.OK)
  async getRiskDistribution() {
    return await this.dashboardService.getRiskDistribution();
  }

  @Get("risk-pyramid")
  @HttpCode(HttpStatus.OK)
  async getRiskPyramid() {
    return await this.dashboardService.getRiskPyramid();
  }

  @Get("age-vs-fragility")
  @HttpCode(HttpStatus.OK)
  async getAgeVsFragility() {
    return await this.dashboardService.getAgeVsFragility();
  }

  @Get("domain-performance")
  @HttpCode(HttpStatus.OK)
  async getDomainPerformanceOverview() {
    return await this.dashboardService.getDomainPerformanceOverview();
  }

  @Get("domain-heatmap")
  @HttpCode(HttpStatus.OK)
  async getDomainHeatmap() {
    return await this.dashboardService.getDomainHeatmap();
  }
}
