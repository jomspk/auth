type Client = {
    client_id: string;
    redirect_uri: string;
    scope: string[];
    client_name: string;
    client_secret: string;
    code: AuthCode | null;
}

type AuthCode = {
    code: string;
    expires_at: Date;
    scope: string[];
    access_token: AccessToken | null;
}

type AccessToken = {
    token: string[];
}

export type { Client, AuthCode, AccessToken };