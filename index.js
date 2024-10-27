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
        sameSite: "none",
        secure: false,
    })
);
app.use(express.json());
app.use(cookieParser());
app.use("/upload/user", express.static("upload/user"));

//Custom middleware
const verifyToken = (req, res, next) => {
    const token = req.cookies.token;
    console.log("Token", token);
    if (!token) {
        return res.status(401).json({error: "Unauthorized"});
    }

    console.log(token);
    try {
        const decoded = jwt.verify(token, process.env.JWT_Secrate);
        req.user = decoded;
        console.log("Decoded", decoded);
        next();
    } catch (error) {
        return res
            .status(401)
            .json({error: "Unauthorized request", message: error});
    }
};

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
        const books = db.collection("books");
        console.log("Connected to the database");

        app.post("/login", async (req, res) => {
            const {email, uId, name, metadata, profilePic} = req.body;
            console.log(email, uId, name, metadata);
            console.log("Called it");
            const user = await users.findOne({email: email});
            if (!user) {
                await users.insertOne({
                    email: email,
                    uId: uId,
                    name: name,
                    profilePic: profilePic,
                    metadata: metadata,
                });
            }
            const token = jwt.sign(
                {
                    email: email,
                    uId: uId,
                },
                process.env.JWT_Secrate,
                {expiresIn: "12h"}
            );
            res.cookie("token", token, {
                httpOnly: true,
                secure: false,
                // sameSite: none,
            });
            console.log("Logged in", token);
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

        app.post(
            "/addBook",
            verifyToken,
            upload.single("photo"),
            async (req, res) => {
                const {email, uId} = req.user;
                const {
                    name,
                    authorName,
                    quantity,
                    category,
                    shortDescription,
                    rating,
                } = req.body;
                const fileBuffer = req.file.buffer;
                const optimizedFileName =
                    Date.now() * Math.round(Math.random() * 1000) +
                    "-" +
                    req.file.originalname;

                const optimizedFilePath = path.join(
                    "upload/BookCovers",
                    optimizedFileName
                );

                try {
                    await sharp(fileBuffer)
                        .jpeg({quality: 50})
                        .toFile(optimizedFilePath);
                    console.log(
                        `Image optimized and saved to ${optimizedFilePath}`
                    );

                    await books.insertOne({
                        name: name,
                        authorName: authorName,
                        quantity: parseInt(quantity),
                        category: category,
                        shortDescription: shortDescription,
                        rating: rating,
                        photo: optimizedFilePath,
                        email: email,
                        uId: uId,
                    });
                } catch (error) {
                    console.error(`Error processing image: ${error.message}`);
                    res.status(500).json({
                        error: "Invalid file type ",
                        message: "Book not added",
                    });
                }

                res.status(200).json({message: "Book added successfully."});
            }
        );

        app.get("/logout", (req, res) => {
            res.clearCookie("token");
            res.json({message: "Logged out"});
        });
    } catch (e) {
        console.error(e);
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
