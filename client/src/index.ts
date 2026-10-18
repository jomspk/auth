import express from "express";
import path from "node:path";
import authRouter from "../routes/auth.js";

const app = express();
const PORT = 3000;

app.get("/", (_req, res) => {
    res.sendFile(path.join(import.meta.dirname, "..", "views", "login.html"));
});

app.use(authRouter);

app.listen(PORT, () => {
    console.log(`localhost:${PORT}で受信しています`);
});