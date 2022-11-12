import express, { json } from "express";
import cors from "cors";
import { MongoClient } from "mongodb";

const app = express();
const mongoClient = new MongoClient("mongodb://localhost:27017");
const serverPort = 5000

app.use(cors());
app.use(express.json());


app.listen(serverPort, () => console.log(`Server running on port ${serverPort}`)) ;