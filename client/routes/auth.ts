import express from "express";

const AUTH_SERVER_URL = "http://localhost:8000/";
const CLIENT_ID = "s6BhdRkqt3";
const REDIRECT_URI = "http://localhost:3000/callback";

const router = express.Router();

router.get("/auth/login", (_, res) => {
    const redirectUri = new URL(AUTH_SERVER_URL + "oauth2/authorize");
    redirectUri.searchParams.append("responseType", "code");
    redirectUri.searchParams.append("clientId", CLIENT_ID);
    redirectUri.searchParams.append("redirectUri", REDIRECT_URI);
    redirectUri.searchParams.append("scope", "read write");
    res.redirect(redirectUri.toString());
})

router.get("/auth/callback", (req, res) => {
    const {code, error} = req.query;
    if(error) {
        console.log(error);
    }

})

export default router;