import { HealthUnitService } from "./health-unit.service";
import { CreateHealthUnitDto } from "./dto/create-health-unit.dto";
import { UpdateHealthUnitDto } from "./dto/update-health-unit.dto";
import { FindHealthcareUnitsQueryDto } from "./dto/find-health-unit-query.dto";
export declare class HealthUnitController {
    private readonly healthUnitService;
    constructor(healthUnitService: HealthUnitService);
    create(createHealthUnitDto: CreateHealthUnitDto): Promise<{
        number: string;
        name: string;
        id: string;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        zipCode: string;
        street: string;
        complement: string | null;
        city: string;
        state: string;
        neighborhood: string;
        name_normalized: string;
    }>;
    findAll(query: FindHealthcareUnitsQueryDto): Promise<{
        data: {
            hasRelations: boolean;
            details: Record<string, number>;
            number: string;
            name: string;
            id: string;
            active: boolean;
            createdAt: Date;
            updatedAt: Date;
            zipCode: string;
            street: string;
            complement: string | null;
            city: string;
            state: string;
            neighborhood: string;
            name_normalized: string;
        }[];
        meta: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<{
        number: string;
        name: string;
        id: string;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        zipCode: string;
        street: string;
        complement: string | null;
        city: string;
        state: string;
        neighborhood: string;
        name_normalized: string;
    }>;
    update(id: string, updateHealthUnitDto: UpdateHealthUnitDto): Promise<{
        number: string;
        name: string;
        id: string;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        zipCode: string;
        street: string;
        complement: string | null;
        city: string;
        state: string;
        neighborhood: string;
        name_normalized: string;
    }>;
    remove(id: string): Promise<{
        hasRelations: boolean;
        number: string;
        name: string;
        id: string;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        zipCode: string;
        street: string;
        complement: string | null;
        city: string;
        state: string;
        neighborhood: string;
        name_normalized: string;
    }>;
}
