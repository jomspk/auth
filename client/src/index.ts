import express from "express";
import path from "node:path";

const app = express();
const PORT = 3000;

app.get("/", (_req, res) => {
    res.redirect("/login");
});

app.get("/login", (_req, res) => {
    res.sendFile(path.join(import.meta.dirname, "..", "views", "login.html"));
});

app.post("/login", (_res) => {
    console.log("ログインボタンが押されました");
});

app.listen(PORT, () => {
    console.log(`localhost:${PORT}で受信しています`);
});