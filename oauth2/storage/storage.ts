// RFC6749 4.1.2節
// 認可コードはclientId, リダイレクトURIに結び付けられる。
// 認可コードは２回以上使用禁止。認可コードが削除されたら、それによって発行されたアクセストークンを無効化すべし。
// 認可コードは発行後短時間で失効しなければならない。最大有効期間は10分が推奨。
import type { Client, AuthCode, AccessToken } from "../types/type.js";

const clients: Client[] = [];

const addClient = (client: Client):Boolean => {
    clients.push(client);
    return true;
}

const getClient = (clientId: string):Client => {
    const client = clients.find(client => client.client_id === clientId);
    if (!client) {
        throw new Error("Invalid clientId");
    }
    return client;
}

const addAuthCode = (clientId: string, authCode: AuthCode):Boolean => {
    const client = getClient(clientId);
    client.codeToken = authCode;
    return true;
}

const addAccessToken = (clientId: string, accessToken: string)

const deleteAuthCode = (clientId: string):Boolean => {
    const client = getClient(clientId);
    return true;
}

export { getClient, addClient, addAuthCode, deleteAuthCode };