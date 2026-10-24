import express from "express";
import path from "node:path";
import {addClient, getClient, addAuthCode, getAuthCodeIndex} from "../storage/storage.js";
import crypto from "node:crypto";
import type {Client, AuthCode} from "../types/type.js"; 
import {basicAuth} from "../utils/util.js";

const app = express();
app.use(express.urlencoded({ extended: true}));
const PORT = 8000;

// RFC6749 4.1.2.1節
// redirect URIが原因, クライアント識別子の欠落で失敗した場合、リダイレクトしてはならない
// エラーレスポンスの時、application/x-www-form-urlencoded形式を使うべし
app.get("/oauth2/authorize", (req, res) => {
    const {responseType, clientId, redirectUri, scope} = req.query;
    console.log(responseType, clientId, redirectUri, scope);
    if (!clientId) {
        return res.status(400).json({error: "invalid_request"});
    }
    const client = getClient(String(clientId));
    if (!client) {
        return res.status(401).json({error: "invalid_request"});
    }
    if (redirectUri !== client.redirect_uri) {
        return res.status(401).json({error: "invalid_request"});
    }
    if (responseType !== "code") {
        const errorUrl = new URL(client.redirect_uri);
        errorUrl.searchParams.set("error", "unsupported_response_type");
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

app.get("/oauth2/permit", (req, res) => {
    // セッションにログイン情報がなければ、ログインさせる
    // ログイン情報があれば、セッションからログイン情報とredirect_URIを取得する
    // この時、redirect_URLは必要。 RFCには、redirect_URLの引き継ぎ方法は書かれていない。セッションにするのが良さそう。
    const {clientId, scope} = req.query;
    const client = getClient(String(clientId));
    if (!client) {
        return res.status(401).json({error: "Invalid client_id"});
    }
    const callbackUrl = new URL(client.redirect_uri);
    const code = crypto.randomBytes(32).toString("hex");
    const expireAt = new Date(Date.now() + 10 * 60 * 1000);
    const scopeArray = String(scope).split(/\s+/);
    const authCode: AuthCode = {
        code,
        expire_at: expireAt,
        scope: scopeArray,
        isUsed: false,
        access_token: null,
    }
    addAuthCode(String(clientId), authCode);
    callbackUrl.searchParams.set("code", code);
    res.redirect(callbackUrl.toString());
})

app.post("/oauth2/accessToken", (req, res) => {
    const {grant_type, code, redirect_uri} = req.body;
    const authHeader = req.headers.authorization;
    try {
        if (!authHeader) {
            throw new Error("invalid_request")
        }
        if (grant_type !== "unsupported_grant_type") {
            throw new Error("invalid_grant");
        }
        if (!code) {
            throw new Error("invalid_request");
        }
        const {clientId, clientSecret} = basicAuth(authHeader);
        const client = getClient(clientId);
        const authCodeIndex = getAuthCodeIndex(clientId, code);
        const authCode = client.codeToken[authCodeIndex];
        if (client.client_secret !== clientSecret) {
            throw new Error("invalid_client"); 
        }
        if (!authCode) {
            throw new Error("invalid_grant");
        }
        if (authCode.code !== code) {
            throw new Error("invalid_grant");
        }
        if (authCode.expire_at <= new Date()) {
            throw new Error("invalid_grant");
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unauthorized";
        return res.status(400).set({
            "WWW-Authenticate": 'Basic realm="oauth2"',
            "Content-Type": "application/json;charset=UTF-8",
            "Cache-Control": "no-store",
            "Pragma": "no-cache",
        }).json({error: message});
    }
    // RFC6749 5.1節
    // トークンなどの機密情報を含むレスポンスにおいて、Cache-Control: no-storeとPragma: no-cacheを含めないといけない
    const accessToken = crypto.randomBytes(32).toString("hex");
    res.status(200).set({
        "Content-Type": "application/json;charset=UTF-8",
        "Cache-Control": "no-store",
        "Pragma": "no-cache"
    }).json({
        "access_token": accessToken,
        "token_type": "Bearer",
        "expires_in": 3600, //１時間後にアクセストークン失効
    })
})

app.get("/oauth2/client/registration", (_, res) => {
    res.sendFile(path.join(import.meta.dirname, "..", "views", "clientRegistration.html"));
})

app.post("/oauth2/client/registration", (req, res) => {
    const {client_name, redirect_uri, scope} = req.body;
    console.log(client_name, redirect_uri, scope);
    if (!redirect_uri || !client_name || !scope) {
        return res.status(400).json({error: "missing required fields"});
    }
    if (scope.length === 0) {
        return res.status(400).json({error: "scope is required"});
    }
    const client_id = crypto.randomUUID();
    const client_secret = crypto.randomBytes(32).toString("hex");
    const client: Client = {
        client_id,
        redirect_uri,
        scope,
        client_name,
        client_secret,
        codeToken: [],
    }
    addClient(client);
    res.status(200).json(client);
})

app.listen(PORT, () => {
    console.log(`localhost:${PORT}で認可サーバーが動いています`);
});