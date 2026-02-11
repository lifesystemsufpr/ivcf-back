import { HealthCheckService, MemoryHealthIndicator } from "@nestjs/terminus";
export declare class HealthcheckController {
    private readonly health;
    private readonly memory;
    constructor(health: HealthCheckService, memory: MemoryHealthIndicator);
    check(): Promise<import("@nestjs/terminus").HealthCheckResult>;
}
