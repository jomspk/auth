import "express-session";

declare module "express-session" {
    interface SessionData {
        authRequest?: {
            clientId: string;
            redirectUri: string;
            scope: string;
        };
    }
}
