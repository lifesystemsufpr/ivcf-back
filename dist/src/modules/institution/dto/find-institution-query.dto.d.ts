import { QueryDto } from "src/shared/dto/query.dto";
export declare class FindInstitutionsQueryDto extends QueryDto {
    title?: string;
    active?: boolean;
    orderBy?: "title" | "createdAt";
    sortOrder?: "asc" | "desc";
}
