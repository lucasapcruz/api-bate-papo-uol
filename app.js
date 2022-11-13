import express, { json } from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import joi from "joi";
import dayjs from "dayjs"

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());


const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;


try {
    await mongoClient.connect();
    db = mongoClient.db("app-batepapo")
} catch (error) {
    console.log(error)
}


const participantSchema = joi.object({
    name: joi.string().required()
})

app.post("/participants", async (req, res) => {
    const participant = req.body
    const participantValidation = participantSchema.validate(participant)

    if (participantValidation.error) {
        res.sendStatus(422)
        return
    }

    try {
        const nameNotAvailable = await db.collection("participants").findOne(participant)

        if (nameNotAvailable) {
            res.sendStatus(409)
            return
        }

        const currentTime = Date.now()
        const newParticipant = { ...participant, lastStatus: currentTime }
        await db.collection("participants").insertOne(newParticipant)

        const message = {
            from: participant.name,
            to: "Todos",
            text: "entra na sala...",
            type: "status",
            time: dayjs(currentTime).format("HH:mm:ss")
        }

        await db.collection("messages").insertOne(message)
        res.sendStatus(201)

    } catch {
        res.sendStatus(500)
    }

});

app.get("/participants", async (req, res) => {

    try{
        const participants = await db.collection("participants").find().toArray()
        res.status(200).send(participants)
    }catch(error){
        console.log(error)
        res.sendStatus(500)
    }


})


app.listen(process.env.SERVER_PORT, () => console.log(`Server running on port ${process.env.SERVER_PORT}`));