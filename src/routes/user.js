const router = require("express").Router();
const {
  Get,
  Ref,
  Collection,
  Match,
  Index,
  Paginate,
  Map,
  Lambda,
  Var,
  Select,
} = require("faunadb");
const client = require("../database/fauna-config");

router.get("/specific/by-id/:id", async (req, res) => {
  const fauna = client();

  try {
    //Get ID
    const id = req.params.id;

    //Query
    const doc = await fauna.query(Get(Ref(Collection("users"), id)));

    res.status(200).json({
      status: 200,
      userID: id,
      data: doc,
    });
  } catch (err) {
    res.status(200).json(err);
  }
});

router.get("/specific/by-email/:email", async (req, res) => {
  const fauna = client();

  try {
    //Get email
    const email = req.params.email;

    //Query
    const doc = await fauna.query(
      Get(Match(Index("user_by_email_main"), email))
    );

    res.status(200).json({
      status: 200,
      userEmail: email,
      data: doc,
    });
  } catch (err) {
    res.status(200).json(err);
  }
});

router.get("/songs/:id", async (req, res) => {
  const fauna = client();

  try {
    //Get ID
    const id = req.params.id;

    //Create FQL
    const fql = Ref(Collection("users"), id);

    //Query
    const docs = await fauna.query(
      Paginate(Match(Index("video_by_user"), fql))
    );

    //Extract the ids
    const extracted = [];
    docs.data.map((e) => {
      extracted.push(e.id);
    });

    //Final Query
    const finalDocs = await fauna.query(
      Map(extracted, Lambda("id", Get(Ref(Collection("videos"), Var("id")))))
    );

    res.status(200).json({
      status: 200,
      id: id,
      data: {
        ids: extracted,
        videos: finalDocs,
      },
    });
  } catch (err) {
    res.status(200).json(err);
  }
});

router.get("/followers/:id", async (req, res) => {
  const fauna = client();

  try {
    //Get ID
    const userID = req.params.id;

    //Create FQL
    const fql = Ref(Collection("users"), userID);

    //Query
    const docs = await fauna.query(
      Paginate(Match(Index("followee_to_follower_main"), fql))
    );

    //Extract the ids
    const extracted = [];
    docs.data.map((e) => {
      extracted.push(e.id);
    });

    //Final Query
    const finalDocs = await fauna.query(
      Map(
        extracted,
        Lambda(
          "id",
          Get(
            Select(
              "follower",
              Select("data", Get(Ref(Collection("follower_to_followee_edge"), Var("id"))))
            )
          )
        )
      )
    );

    res.status(200).json({
      status: 200,
      userID: userID,
      data: {
        ids: extracted,
        data: finalDocs,
      },
    });
  } catch (err) {
    res.status(200).json(err);
  }
});

router.get("/follower-count/:id", async (req, res) => {
  const fauna = client();

  try {
    //Get ID
    const userID = req.params.id;

    //Create FQL
    const fql = Ref(Collection("users"), userID);

    //Query
    const docs = await fauna.query(
      Paginate(Match(Index("followee_to_follower_main"), fql))
    );

    //Get Follower Count
    const followerCount = docs.data.length

    res.status(200).json({
      status: 200,
      userID: userID,
      followerCount : followerCount
    });
  } catch (err) {
    res.status(200).json(err);
  }
});

module.exports = router;
