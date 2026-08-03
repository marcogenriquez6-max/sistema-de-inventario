export interface AuthUser {
    id: number;
    email: string;
    fullName: string;
    role: string;
}
export declare const CurrentUser: (...dataOrPipes: unknown[]) => ParameterDecorator;
