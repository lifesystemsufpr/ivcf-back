declare const LocalAuthGuard_base: import("@nestjs/passport").Type<import("@nestjs/passport").IAuthGuard>;
export declare class LocalAuthGuard extends LocalAuthGuard_base {
    private readonly logger;
    handleRequest(err: any, user: any, info: any): any;
}
export {};
