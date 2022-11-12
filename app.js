import express, { json } from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const mongoClient = new MongoClient(process.env.MONGO_URI);

app.use(cors());
app.use(express.json());


app.listen(process.env.SERVER_PORT, () => console.log(`Server running on port ${process.env.SERVER_PORT}`)) ;