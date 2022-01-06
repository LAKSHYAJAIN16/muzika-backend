//Dependencies
const express = require("express");
const cors = require("cors");
const app = express();

//Routes
const testRoutes = require("./routes/tests");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const songRoutes = require("./routes/songs");
const followRoutes = require("./routes/follow");
const heartRoutes = require("./routes/heart");
const commentRoutes = require("./routes/comments");
const viewRoutes = require("./routes/views");
const rankingRoutes = require("./routes/ranking");

//Use Cors So That I don't spend 14 days to figure out WRS errors
app.use(cors());
app.use(express.json());

//Use Routes
app.use("/", testRoutes);
app.use("/api/user", authRoutes);
app.use("/api/songs", songRoutes);
app.use("/api/rankings", rankingRoutes);
app.use("/api/graph/users", userRoutes);
app.use("/api/graph/followers", followRoutes);
app.use("/api/graph/hearts", heartRoutes);
app.use("/api/graph/comments", commentRoutes);
app.use("/api/graph/views", viewRoutes);

//Initialize the app
const port = 1935;
app.listen(port, () => console.log("server's live boiz"));
