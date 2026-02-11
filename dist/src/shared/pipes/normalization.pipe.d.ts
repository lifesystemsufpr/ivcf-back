import { PipeTransform } from "@nestjs/common";
export declare class NormalizationPipe implements PipeTransform {
    transform(value: unknown): unknown;
    private normalizeObject;
    private isObject;
    private normalizeString;
}
