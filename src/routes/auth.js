//Dependencies
const router = require("express").Router();
const { scryptSync, randomBytes, timingSafeEqual } = require("crypto");
const client = require("../database/fauna-config");

const { Create, Collection, Get, Match, Index } = require("faunadb").query;

router.post("/signup", async (req, res) => {
  //Initialize Fauna Client
  const fauna = client();

  //Hash Password using crypto module
  const salt = randomBytes(16).toString("hex");
  const hashedPassword = scryptSync(req.body.password, salt, 64).toString(
    "hex"
  );
  const newPassword = `${salt}:${hashedPassword}`;

  //Define Data
  const data = {
    name: req.body.name,
    email: req.body.email,
    provider: req.body.provider,
    intent: req.body.intent,
    password: newPassword,
    photo : req.body.photo,
    country: req.body.country || "unknown",
    gender: req.body.gender || "unknown",
    likedArtists: req.body.likedArtists || [],
    instruments: req.body.instruments || [],
    songs: req.body.songs || [],
    isLive: req.body.isLive || false,
    live: req.body.live || {},
  };

  //Define Query using FQL
  try {
    const doc = await fauna.query(Create(Collection("users"), { data }));
    res.status(200).send(doc);
  } catch (error) {
    res.json(error);
  }
});

router.get("/login", async (req, res) => {
  //Initialize Fauna Client
  const fauna = client();

  //Retrieve the Document by the email address
  const email = req.body.email;
  try {
    const doc = await fauna.query(
      Get(Match(Index("user_by_email_main"), email))
    );
    //Get the password and check
    const password = doc.data.password;
    const [salt, key] = password.split(":");
    const hashedBuffer = scryptSync(req.body.password, salt, 64);
    const finalBuffer = Buffer.from(key, "hex");
    const match = timingSafeEqual(hashedBuffer, finalBuffer);

    if (match) {
      //Return 200
      res.status(200).json({ data: doc, code: "RA1" });
    } else {
      //Return 401
      res.status(401).json({ result: "RD2" });
    }
  } catch (error) {
    res.status(400).json({ result: "RD1" });
  }
});

module.exports = router;
