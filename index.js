const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();

// middleware
app.use(
    cors({
        origin: ["http://localhost:3000"],
        credentials: true,
    })
);
app.use(express.json());
app.use(cookieParser());

// Routes
app.get("/", (req, res) => {
    res.json({message: "Server is running "});
});

app.listen(5000, () => {
    console.log("Server is running on port 5000");
});
