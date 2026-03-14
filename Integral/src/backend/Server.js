import express from "express";
import mysql from "mysql2";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "integral",
});

db.connect((err) => {
  if (err) throw err;
  console.log("MySQL conectado");
});

app.get("/clientes", (req, res) => {
  db.query("SELECT * FROM clientes", (err, result) => {
    if (err) throw err;
    res.json(result);
  });
});

app.listen(3001, () => {
  console.log("Servidor corriendo");
});
