import express from "express";
import path from "node:path";
import {addClient, getClient, addAuthCode, getAuthCodeIndex, updateAuthCode} from "../storage/storage.js";
import crypto from "node:crypto";
import type {Client, AuthCode, AccessToken} from "../types/type.js"; 
import {basicAuth} from "../utils/util.js";
import session from "express-session";

const app = express();
app.use(express.urlencoded({ extended: true}));
app.use(session({
    secret: "dev-secret",
    resave: false,
    saveUninitialized: false,
}))
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
    req.session.authRequest = {
        clientId: String(clientId),
        redirectUri: String(redirectUri),
        scope: String(scope),
    }
    res.sendFile(path.join(import.meta.dirname, "..", "views", "authorize.html"));
});

app.post("/oauth2/authorize", (req, res) => {
    // セッションにログイン情報がなければ、ログインさせる
    // ログイン情報があれば、セッションからログイン情報とredirect_URIを取得する
    // この時、redirect_URLは必要。 RFCには、redirect_URLの引き継ぎ方法は書かれていない。セッションにするのが良さそう。
    const authRequest = req.session.authRequest;
    if (!authRequest) {
        return res.status(400).json({error: "invalid_request"});
    }
    const {clientId, scope} = authRequest;
    delete req.session.authRequest;
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
    console.log(callbackUrl.toString());
    res.redirect(callbackUrl.toString());
})

// RFC6749 5.2節
// invalid_clientを返すときは、401を返して、認可サーバが採用している認証スキームを返す必要あり
// RFC9110 15.5節
// 401を返す時は, www-authenticateを返す必要あり
app.post("/oauth2/token", (req, res) => {
    const {grant_type, code, redirect_uri} = req.body;
    const authHeader = req.headers.authorization;
    console.log(grant_type, code, redirect_uri);
    try {
        if (grant_type !== "authorization_code") {
            throw new Error("invalid_grant");
        }
        if (!code) {
            throw new Error("invalid_request");
        }
        if (!authHeader) {
            throw new Error("invalid_client")
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
        const accessToken:AccessToken = {
            access_token: crypto.randomBytes(32).toString("hex"),
            token_type: "Bearer",
            expire_at: new Date(Date.now() + 10 * 60 * 1000)
        }
        authCode.isUsed = true
        authCode.access_token = accessToken
        updateAuthCode(clientId, authCode)
        // RFC6749 5.1節
        // トークンなどの機密情報を含むレスポンスにおいて、Cache-Control: no-storeとPragma: no-cacheを含めないといけない
        res.status(200).set({
            "Content-Type": "application/json;charset=UTF-8",
            "Cache-Control": "no-store",
            "Pragma": "no-cache"
        }).json({
            "access_token": accessToken.access_token,
            "token_type": accessToken.token_type,
            "expires_in": 3600, //１時間後にアクセストークン失効
        })
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unauthorized";
        if (message === "invalid_client") {
            return res.status(401).set({
                "WWW-Authenticate": 'Basic realm="oauth2"',
                "Content-Type": "application/json;charset=UTF-8",
                "Cache-Control": "no-store",
                "Pragma": "no-cache",
            })
        }
        return res.status(400).set({
            "Content-Type": "application/json;charset=UTF-8",
            "Cache-Control": "no-store",
            "Pragma": "no-cache",
        }).json({error: message});
    }
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