import express from "express";

const AUTH_SERVER_URL = "http://localhost:8000/";
const CLIENT_ID = "s6BhdRkqt3";
const REDIRECT_URI = "http://localhost:3000/callback";

const router = express.Router();

router.get("/auth/login", (_, res) => {
    let redirectUrl = AUTH_SERVER_URL + "oauth2/authorize" + "?response_type=code" + `&client_id=${CLIENT_ID}` + `&redirect_uri=${REDIRECT_URI}` + "&scope=read%20write";
    res.redirect(redirectUrl);
})

export default router;