const router = require("express").Router();
const client = require("../database/fauna-config");
const { Create, Collection, Get, Match, Index, Ref } = require("faunadb").query;

router.post("/create", async (req, res) => {
  //Initialize Client
  const fauna = client();

  try {
    //First, Retrieve the User by the email
    const email = req.body.user.email;
    const user = await fauna.query(
      Get(Match(Index("user_by_email_main"), email))
    );

    //Create new Data Object for video
    const data = {
      userRef: user,
      information: req.body,
    };

    //Create Video using that data
    const video = await fauna.query(Create(Collection("videos"), { data }));

    //Now, create an GraphQL Edge between the Data
    const edgeData = {
      user: user,
      video: video,
    };
    const edge = await fauna.query(
      Create(Collection("user_to_song_edge"), { data: edgeData })
    );

    res.status(200).json({
      Status: "OK",
      Code: 200,
      request: req.body,
      edgeCreated: edge,
      videoCreated: video,
      user: user,
      result: "Successful FQL Query, everything's fine on the backend side boi",
    });
  } catch (err) {
    res.status(400).json({
      Status: "ERROR! ERROR!",
      Error: { err },
    });
  }
});

router.get("/specific/id/:id", async (req, res) => {
  //Initialize Client
  const fauna = client();

  try {
    //Get ID
    const id = req.params.id;

    //Retrieve the Video by the ID
    const video = await fauna.query(Get(Ref(Collection("videos"), id)));
    res.status(200).json({
      Status: "OK",
      video: video,
      message: "looking good, backend's working yo dawg",
    });
  } catch (err) {
    res.status(400).json({ Status: "ERROR! ERROR! ERROR", Error: err });
  }
});

module.exports = router;
