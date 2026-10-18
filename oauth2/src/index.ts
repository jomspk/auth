import express from "express";

const app = express();
const PORT = 8000;
const CLIENT_ID = "s6BhdRkqt3";

app.get("/oauth2/authorize", (req, res) => {
    console.log("hello, this auth2");
    console.log(req.query);
    res.redirect("http://localhost:3000");
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