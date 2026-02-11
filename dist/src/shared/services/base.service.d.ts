import { PrismaClient, Prisma } from "@prisma/client";
import { QueryDto } from "../dto/query.dto";
type PrismaDelegate = {
    findMany: (args: any) => Prisma.PrismaPromise<any[]>;
    count: (args: any) => Prisma.PrismaPromise<number>;
};
type WhereInput<T extends PrismaDelegate> = Parameters<T["findMany"]>[0]["where"];
type Include<T extends PrismaDelegate> = Parameters<T["findMany"]>[0]["include"];
export declare abstract class BaseService<T extends PrismaDelegate, TransformedEntity> {
    protected readonly prisma: PrismaClient;
    protected readonly model: T;
    protected readonly searchableFields: string[];
    protected readonly defaultInclude: Include<T>;
    constructor(prisma: PrismaClient, model: T, searchableFields?: string[], defaultInclude?: Include<T>);
    protected abstract transform(entity: any): TransformedEntity;
    findAll(queryDto: QueryDto, additionalWhere?: WhereInput<T>): Promise<{
        data: TransformedEntity[];
        meta: {
            total: number;
            page: number;
            pageSize: number;
            lastPage: number;
        };
    }>;
}
export {};
