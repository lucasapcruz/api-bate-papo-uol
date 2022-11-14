import express, { json } from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import joi from "joi";
import dayjs from "dayjs";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;

try {
  await mongoClient.connect();
  db = mongoClient.db("app-batepapo");
} catch (error) {
  console.log(error);
}

const participantSchema = joi.object({
  name: joi.string().required(),
});

const messageSchema = joi.object({
  to: joi.string().required(),
  text: joi.string().required(),
  type: joi.string().valid("message", "private_message"),
});

setInterval(rmInactiveParticipants, 15000);

app.post("/participants", async (req, res) => {
  const participant = req.body;
  const participantValidation = participantSchema.validate(participant);

  if (participantValidation.error) {
    res.sendStatus(422);
    return;
  }

  try {
    const nameNotAvailable = await db
      .collection("participants")
      .findOne(participant);

    if (nameNotAvailable) {
      res.sendStatus(409);
      return;
    }

    const currentTime = Date.now();
    const newParticipant = { ...participant, lastStatus: currentTime };
    await db.collection("participants").insertOne(newParticipant);

    const message = {
      from: participant.name,
      to: "Todos",
      text: "entra na sala...",
      type: "status",
      time: dayjs(currentTime).format("HH:mm:ss"),
    };

    await db.collection("messages").insertOne(message);
    res.sendStatus(201);
  } catch {
    res.sendStatus(500);
  }
});

app.get("/participants", async (req, res) => {
  try {
    const participants = await db.collection("participants").find().toArray();
    res.status(200).send(participants);
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});

app.post("/messages", async (req, res) => {
  const receivedMessage = req.body;
  const participant = req.headers.User;
  const isNotValidBody = messageSchema.validate(receivedMessage).error;
  const isNotActiveParticipant = await db
    .collection("participants")
    .findOne({ name: participant }).error;
  const isNotValidMessage = isNotValidBody || isNotActiveParticipant;

  if (isNotValidMessage) {
    res.sendStatus(422);
    return;
  }

  const message = {
    from: participant,
    ...receivedMessage,
    time: dayjs(Date.now()).format("HH:mm:ss"),
  };

  try {
    await db.collection("participants").insertOne(message);
    res.sendStatus(201);
  } catch (error) {
    res.sendStatus(500);
  }
});

app.get("/messages", async (req, res) => {
  const limit = req.query.limit;
  const participant = req.headers.user;

  try {
    if (limit) {
      const messages = await db
        .collection("messages")
        .find({
          $or: [{ to: participant }, { from: participant }],
        })
        .sort({ time: -1 })
        .limit(parseInt(limit))
        .toArray();
      res.status(200).send(messages);
      return;
    }

    const messages = await db
      .collection("messages")
      .find({
        $or: [{ to: participant }, { from: participant }],
      })
      .sort({ time: -1 })
      .toArray();
    res.status(200).send(messages);
  } catch (error) {
    res.sendStatus(500);
  }
});

app.post("/status", async (req, res) => {
  const participant = req.headers.User;

  try {
    const isNotActiveParticipant = await db
      .collection("participants")
      .findOne({ name: participant }).error;
    if (isNotActiveParticipant) {
      res.sendStatus(404);
    }
    await db.collection("participants").updateOne(
      {
        name: participant,
      },
      {
        $set: {
          lastStatus: Date.now(),
        },
      }
    );
    res.sendStatus(200);
  } catch (error) {
    res.sendStatus(500);
  }
});

async function rmInactiveParticipants() {
  try {
    const cutoffTime = Date.now() - 10;
    const inactiveParticipants = await db
      .collection("participants")
      .find({ lastStatus: { $lt: cutoffTime } })
      .toArray();
    inactiveParticipants.forEach(async (participant) => {
      const message = {
        from: participant.name,
        to: "Todos",
        text: "sai da sala...",
        type: "status",
        time: dayjs(Date.now()).format("HH:mm:ss"),
      };
      await db.collection("participants").deleteOne({ _id: participant._id });
      await db.collection("messages").insertOne(message);
    });
  } catch (error) {
    console.log(error);
  }
}

app.listen(process.env.SERVER_PORT, () =>
  console.log(`Server running on port ${process.env.SERVER_PORT}`)
);
