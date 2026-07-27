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
  async getAverageScore(@Query() filters: DashboardFilterDto) {
    return await this.dashboardService.getAverageScore(filters);
  }

  @Get("average-age")
  @HttpCode(HttpStatus.OK)
  async getAverageAge(@Query() filters: DashboardFilterDto) {
    return await this.dashboardService.getAverageAge(filters);
  }

  @Get("age-distribution")
  @HttpCode(HttpStatus.OK)
  async getAgeDistribution(@Query() filters: DashboardFilterDto) {
    return await this.dashboardService.getAgeDistribution(filters);
  }

  @Get("risk-distribution")
  @HttpCode(HttpStatus.OK)
  async getRiskDistribution(@Query() filters: DashboardFilterDto) {
    return await this.dashboardService.getRiskDistribution(filters);
  }

  @Get("risk-pyramid")
  @HttpCode(HttpStatus.OK)
  async getRiskPyramid(@Query() filters: DashboardFilterDto) {
    return await this.dashboardService.getRiskPyramid(filters);
  }

  @Get("age-vs-fragility")
  @HttpCode(HttpStatus.OK)
  async getAgeVsFragility(@Query() filters: DashboardFilterDto) {
    return await this.dashboardService.getAgeVsFragility(filters);
  }

  @Get("domain-performance")
  @HttpCode(HttpStatus.OK)
  async getDomainPerformanceOverview(@Query() filters: DashboardFilterDto) {
    return await this.dashboardService.getDomainPerformanceOverview(filters);
  }

  @Get("domain-heatmap")
  @HttpCode(HttpStatus.OK)
  async getDomainHeatmap(@Query() filters: DashboardFilterDto) {
    return await this.dashboardService.getDomainHeatmap(filters);
  }
}
