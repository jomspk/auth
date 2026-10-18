// 認可コードはclientId, リダイレクトURIに結び付けられる。
// 認可コードが有効であること。２回以上使用禁止。認可コードが削除されたら、それによって発行されたアクセストークンを無効化すべし。
// 4.1.2 認可コードは発行後短時間で失効しなければならない。最大有効期間は10分が推奨。
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

const clients: Client[] = [];

const addClient = (client: Client) => {
    clients.push(client);
}

const addAuthCode = (clientId: string, authCode: AuthCode) => {
    const client = clients.find(client => client.client_id === clientId);
    if (!client) {
        throw new Error("Invalid clientId");
    }
    client.code = authCode;
}

const deleteAuthCode = (clientId: string) => {
    const client = clients.find(client => client.client_id === clientId);
}
