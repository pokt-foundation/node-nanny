import express from "express";
import { Alert } from "../services";

const alert = new Alert();
const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.post("/webhook/datadog/monitor", async ({ body }, res) => {
  try {
    await alert.processWebhook(body);
    res.json({ done: true });
  } catch (error) {
    res.sendStatus(500);
  }
});

app.listen(port, () => {
  console.log(`Webhook api listening at http://localhost:${port}`);
});