import express from "express";
import path from "node:path";
import {addClient, getClient, addAuthCode} from "../storage/storage.js";
import crypto from "node:crypto";
import type {Client, AuthCode} from "../types/type.js"; 
import {basicAuth} from "../utils/util.js";

const app = express();
app.use(express.urlencoded({ extended: true}));
const PORT = 8000;

app.get("/oauth2/authorize", (req, res) => {
    const {responseType, clientId, redirectUri, scope} = req.query;
    console.log(responseType, clientId, redirectUri, scope);
    if (!clientId) {
        return res.status(400).json({error: "missing clientId"});
    }
    const client = getClient(String(clientId));
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
            throw new Error("Missing authHeader")
        }
        if (grant_type !== "authorization_code") {
            throw new Error("Invalild grant type");
        }
        if (!code) {
            throw new Error("Missing code");
        }
        const {clientId, clientSecret} = basicAuth(authHeader);
        const client = getClient(clientId);
        if (client.client_secret !== clientSecret) {
            throw new Error("Invalid clientSecret"); 
        }
        if (!client.codeToken) {
            throw new Error("Missing AuthCode");
        }
        if (client.codeToken.code !== code) {
            throw new Error("Invalid AuthCode");
        }
        if (client.codeToken.expire_at <= new Date()) {
            throw new Error("Expired AuthCode");
        }

    } catch (error) {
        const message = error instanceof Error ? error.message : "Unauthorized";
        return res.status(401).set("WWW-Authenticate", 'Basic realm="oauth2"').json({error: message});
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
        codeToken: null,
    }
    addClient(client);
    res.status(200).json(client);
})

app.listen(PORT, () => {
    console.log(`localhost:${PORT}で認可サーバーが動いています`);
});