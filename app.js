import express, { json } from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import joi from "joi"

dotenv.config();

const app = express();
const mongoClient = new MongoClient(process.env.MONGO_URI);

app.use(cors());
app.use(express.json());

const participantSchema = joi.object({
    name: joi.string().required()
})

app.post("/participants", (req, res) => {
    const participant = req.body
    const participantValidation = participantSchema.validate(participant)

    if(participantValidation.error){
        res.sendStatus(422)
        return
    }

    res.sendStatus(201)
  });


app.listen(process.env.SERVER_PORT, () => console.log(`Server running on port ${process.env.SERVER_PORT}`)) ;