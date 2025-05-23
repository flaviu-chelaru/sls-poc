import {DynamoDBDocumentClient, GetCommand, PutCommand} from "@aws-sdk/lib-dynamodb";
import {DynamoDBClient} from "@aws-sdk/client-dynamodb";
import serverless from "serverless-http";
import express from "express";

const app = express();
app.use(express.json());

const USERS_TABLE = process.env.USERS_TABLE;
const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);

app.get("/users/:userId", async (req: express.Request, res: express.Response) => {
    const params = {
        TableName: USERS_TABLE,
        Key: {
            userId: req.params.userId,
        },
    };

    try {
        const command = new GetCommand(params);
        const {Item} = await docClient.send(command);
        if (Item) {
            const {userId, name} = Item;
            res.json({userId, name});
        } else {
            res
                .status(404)
                .json({error: 'Could not find user with provided "userId"'});
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({error: "Could not retrieve user"});
    }
});

app.post("/users", async (req, res) => {
    const {userId, name} = req.body;
    if (typeof userId !== "string") {
        res.status(400).json({error: '"userId" must be a string'});
    } else if (typeof name !== "string") {
        res.status(400).json({error: '"name" must be a string'});
    }

    const params = {
        TableName: USERS_TABLE,
        Item: {userId, name},
    };

    try {
        const command = new PutCommand(params);
        await docClient.send(command);
        res.json({userId, name});
    } catch (error) {
        console.error(error);
        res.status(500).json({error: "Could not create user"});
    }
});
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.status(404).json({
        error: "Not Found",
    });
});

export const handler = serverless(app);
