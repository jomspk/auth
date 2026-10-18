import express from "express";
import path from "node:path";

const app = express();
const PORT = 8000;
const CLIENT_ID = "s6BhdRkqt3";
const REDIRECT_URI = "http://localhost:3000/callback";

app.get("/oauth2/authorize", (req, res) => {
    console.log("hello, this auth2");
    console.log(req.query);
    if (req.query.client_id !== CLIENT_ID) {
        return res.status(401).json({error: "Unauthorized"});
    }
    if (req.query.redirect_uri !== REDIRECT_URI) {
        return res.status(401).json({error: "Wrong redirectURI"});
    }
    res.sendFile(path.join(import.meta.dirname, "..", "views", "authorize.html"));
});

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