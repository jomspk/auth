// 認可コードはclientId, リダイレクトURIに結び付けられる。
// 認可コードが有効であること。２回以上使用禁止。認可コードが削除されたら、それによって発行されたアクセストークンを無効化すべし。
// 4.1.2 認可コードは発行後短時間で失効しなければならない。最大有効期間は10分が推奨。
import type { Client, AuthCode, AccessToken } from "../types/type.js";

const clients: Client[] = [];

const addClient = (client: Client) => {
    clients.push(client);
}

const getClient = (clientId: string) => {
    return clients.find(client => client.client_id === clientId);
}

const addAuthCode = (clientId: string, authCode: AuthCode) => {
    const client = getClient(clientId);
    if (!client) {
        throw new Error("Invalid clientId");
    }
    client.code = authCode;
}

const deleteAuthCode = (clientId: string) => {
    const client = getClient(clientId);
}

export { getClient, addClient, addAuthCode, deleteAuthCode };