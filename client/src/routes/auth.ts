import express from "express";
import {config} from "../../config.js";

const AUTH_SERVER_URL = "http://localhost:8000/";

const router = express.Router();

router.get("/auth/login", (_, res) => {
    const redirectUri = new URL(AUTH_SERVER_URL + "oauth2/authorize");
    redirectUri.searchParams.append("responseType", "code");
    redirectUri.searchParams.append("clientId", config.client_id);
    redirectUri.searchParams.append("redirectUri", config.redirect_uri);
    redirectUri.searchParams.append("scope", "read write");
    res.redirect(redirectUri.toString());
})

// RFC7617(Basic HTTP認証)

// スキーム名はBasic

// Server から　 クライアント向け(クライアントに認証方式を知らせるために使う)
// 認証パラメータrealmは必須
// 認証パラメータcharsetは任意。これはエンコード形式のこと、UTF-8である必要あり。
// その他のパラメータは無視

// クライアント　から Server向け
// まずは"UserId:Password"の並びにする
// UserId:Passwordをバイト列(オクテット列)に変換
// バイト列をBase64でエンコード

// コロン文字を含むUserIdは無効
router.get("/auth/callback", async (req, res) => {
    const {code, error} = req.query;
    if(error) {
        console.log(error);
    }
    const userPass = Buffer.from(`${config.client_id}:${config.client_secret}`).toString("base64");
    // RFC6749の4.1.3
    // application/x-www-form-urlencoded形式で送信
    // 必須パラメータ
    // grant_type: 値は"authorization_code"がmust
    // code: 認可コード
    // redirect_uri: 認可リクエストに含めていた場合は必須
    // client: 認可サーバーがクライアントの認証を行なっていない場合は必須(今回はいらない)
    const accessTokenReq = await fetch(AUTH_SERVER_URL + "/oauth2/accessToken", {
        method: "POST",
        headers: {
            Authorization: `Basic ${userPass}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            grant_type: "authorization_code",
            code: String(code),
        }),
    })

})

export default router;