import { QueryDto } from "src/shared/dto/query.dto";
export declare enum HealthcareUnitOrderBy {
    NAME = "name",
    CREATED_AT = "createdAt",
    CITY = "city"
}
export declare enum SortOrder {
    ASC = "asc",
    DESC = "desc"
}
export declare class FindHealthcareUnitsQueryDto extends QueryDto {
    city?: string;
    state?: string;
    neighborhood?: string;
    active?: boolean;
    startDate?: Date;
    endDate?: Date;
    orderBy?: HealthcareUnitOrderBy;
    sortOrder?: SortOrder;
}
