const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const {MongoClient, ServerApiVersion} = require("mongodb");
require("dotenv").config();
const multer = require("multer");
const sharp = require("sharp");
const path = require("path");

// Create an Express app
const app = express();
const port = process.env.PORT || 5000;

// Connection URI
const uri = `mongodb+srv://${process.env.userName_DB}:${process.env.pass}@bookverse.nywfb3m.mongodb.net/?appName=Bookverse`;

// middleware
app.use(
    cors({
        origin: ["http://localhost:5173"],
        credentials: true,
    })
);
app.use(express.json());
app.use(cookieParser());
app.use("/upload/user", express.static("upload/user"));

// Multer setup
const storage = multer.memoryStorage();
const upload = multer({storage: storage});

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

async function run() {
    try {
        await client.connect();

        // Database Name
        const db = client.db("Bookverse");
        const users = db.collection("users");

        app.post("/login", async (req, res) => {
            const {email, uId} = req.body;

            const token = jwt.sign(
                {
                    email: email,
                    uId: uId,
                },
                process.env.JWT_Secrate,
                {expiresIn: "1h"}
            );
            res.cookie("token", token, {
                httpOnly: true,
                secure: false,
                sameSite: "none",
            });
            res.json({message: "Logged in", token});
        });

        app.post("/uploadUserPic", upload.single("photo"), async (req, res) => {
            const fileBuffer = req.file.buffer;
            const optimizedFileName =
                Date.now() * Math.round(Math.random() * 1000) +
                "-" +
                req.file.originalname;
            const optimizedFilePath = path.join(
                "upload/user",
                optimizedFileName
            );
            try {
                await sharp(fileBuffer)
                    .jpeg({quality: 50})
                    .toFile(optimizedFilePath);
                console.log(
                    `Image optimized and saved to ${optimizedFilePath}`
                );

                // Send a response
                res.status(200).json({
                    message: "File uploaded successfully",
                    path: optimizedFilePath,
                });
            } catch (error) {
                console.error(`Error processing image: ${error.message}`);
                res.status(500).json({error: "Invalid file type"});
            }
        });
    } finally {
    }
}
run().catch(console.dir);

// Routes
app.get("/", (req, res) => {
    res.json({message: "Server is running "});
});

// Start the Express server
app.listen(port, () => {
    console.log("Server is running on port 5000");
});
