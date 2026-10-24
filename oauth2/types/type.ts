type Client = {
    client_id: string;
    redirect_uri: string;
    scope: string[];
    client_name: string;
    client_secret: string;
    codeToken: AuthCode[];
}

type AuthCode = {
    code: string;
    expire_at: Date;
    scope: string[];
    isUsed: Boolean;
    access_token: AccessToken | null;
}

// RFC6749 5.1節
type AccessToken = {
    access_token: string;
    token_type: string;
    expire_at: Date;
}

export type { Client, AuthCode, AccessToken };