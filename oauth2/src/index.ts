import express from "express";
import path from "node:path";

const app = express();
const PORT = 8000;
const CLIENT_ID = "s6BhdRkqt3";
const AUTH_CODE = "hogehoge";
type Client = {
    client_id: string;
    redirect_uri: string;
    scope: string[];
}
const clients: Client[] = [
    {
        client_id: "s6BhdRkqt3",
        redirect_uri: "http://localhost:3000/callback",
        scope: ["read", "write"],
    },
    {
        client_id: "s6BhdRkqt4",
        redirect_uri: "http://hogehoge.com/callback",
        scope: ["read"],
    },
    {
        client_id: "s6BhdRkqt5",
        redirect_uri: "http://fugafuga.com/callback",
        scope: ["read", "write", "admin_only"],
    },
    {
        client_id: "s6BhdRkqt6",
        redirect_uri: "http://piyopiyo.com/callback",
        scope: ["read", "write", "maintainer_only"],
    },
    {
        client_id: "s6BhdRkqt7",
        redirect_uri: "http://foobar.com/callback",
        scope: ["read", "write", "admin_only", "maintainer_only"],
    },
    {
        client_id: "s6BhdRkqt10",
        redirect_uri: "http://bazbaz.com/callback",
        scope: ["read", "admin_only"],
    },
]

app.get("/oauth2/authorize", (req, res) => {
    const {responseType, clientId, redirectUri, scope} = req.query;
    console.log(responseType, clientId, redirectUri, scope);
    const client = clients.find(client => client.client_id === clientId);
    if (!client) {
        return res.status(401).json({error: "Invalid client_id"});
    }
    if (redirectUri !== client.redirect_uri) {
        return res.status(401).json({error: "Invalid redirectURI"});
    }
    if (responseType !== "code") {
        const errorUrl = new URL(client.redirect_uri);
        errorUrl.searchParams.set("error", "invalid_request");
        return res.redirect(errorUrl.toString());
    }
    const requestedScopes = String(scope).split(/\s+/);
    const allowedScopes = new Set(client.scope);
    if (!requestedScopes.every((s) => allowedScopes.has(s))) {
        const errorUrl = new URL(client.redirect_uri);
        errorUrl.searchParams.set("error", "invalid_scope");
        return res.redirect(errorUrl.toString());
    }

    res.sendFile(path.join(import.meta.dirname, "..", "views", "authorize.html"));
});

app.get("/oauth2/permit", (_, res) => {
    // セッションにログイン情報がなければ、ログインさせる
    // ログイン情報があれば、セッションからログイン情報とredirect_URIを取得する
    // この時、redirect_URLは必要。 RFCには、redirect_URLの引き継ぎ方法は書かれていない。セッションにするのが良さそう。
    const clientId = "s6BhdRkqt3";
    const client = clients.find(client => client.client_id === clientId);
    if (!client) {
        return res.status(401).json({error: "Invalid client_id"});
    }
    const callbackUrl = new URL(client.redirect_uri);
    callbackUrl.searchParams.set("code", AUTH_CODE);
    res.redirect(callbackUrl.toString());
})

app.post("/oauth2/client_registration", (req, res) => {
    const {redirect_uri} = req.body;
    if (!redirect_uri) {
        return res.status(400).json({error: "redirect_uri is required"});
    }
    const client = {
        client_id: CLIENT_ID
    }
    res.status(200).json(client);
})

app.listen(PORT, () => {
    console.log(`localhost:${PORT}で認可サーバーが動いています`);
});