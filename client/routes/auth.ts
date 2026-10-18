import express from "express";

const AUTH_SERVER_URL = "http://localhost:8000/";

const router = express.Router();

router.get("/auth/login", (_, res) => {
    let redirectUrl = AUTH_SERVER_URL + "oauth2/authorize" + "?response_type=code" + "&client_id=s6BhdRkqt3" + "&redirect_uri=http://localhost:3000/callback" + "&scope=read%20write";
    res.redirect(redirectUrl);
})

export default router;