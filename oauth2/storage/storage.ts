// RFC6749 4.1.2節
// 認可コードはclientId, リダイレクトURIに結び付けられる。
// 認可コードは２回以上使用禁止。認可コードが削除されたら、それによって発行されたアクセストークンを無効化すべし。
// 認可コードは発行後短時間で失効しなければならない。最大有効期間は10分が推奨。
// 認可コードは複数発行できる。一回のターンに一回発行可能。
import type { Client, AuthCode } from "../types/type.js";

const clients: Client[] = [];

const addClient = (client: Client):void => {
    clients.push(client);
}

const getClient = (clientId: string):Client => {
    const client = clients.find(client => client.client_id === clientId);
    if (!client) {
        throw new Error("Invalid clientId");
    }
    return client;
}

const addAuthCode = (clientId: string, authCode: AuthCode):void => {
    const client = getClient(clientId);
    client.codeToken.push(authCode);
}

const getAuthCodeIndex = (clientId: string, code: string):number => {
    const client = getClient(clientId);
    const index = client.codeToken.findIndex(codeToken => codeToken.code === code);
    if (index === -1) {
        throw new Error("invalid code");
    }
    return index
}

const updateAuthCode = (clientId: string, authCode: AuthCode):void => {
    const client = getClient(clientId);
    const authCodeIndex = getAuthCodeIndex(clientId, authCode.code);
    client.codeToken[authCodeIndex] = authCode;
}

const deleteAuthCode = (clientId: string):void => {
    const client = getClient(clientId);
}

export { getClient, addClient, addAuthCode, deleteAuthCode, updateAuthCode, getAuthCodeIndex };