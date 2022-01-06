const router = require("express").Router();
const client = require("../database/fauna-config");
const {
  Create,
  Collection,
  Paginate,
  Match,
  Index,
  Map,
  Lambda,
  Var,
  Get,
  Ref,
  Select
} = require("faunadb").query;

router.post("/view/level-1/:id", async (req, res) => {
  const fauna = client();

  try {
    //In Level 1, we don't record who viewed the document, we just record the view
    const videoID = req.params.id;

    //Declare Data
    const data = {
      level: 1,
      videoID: videoID,
      userID: "anonymous",
      userName: "anonymous",
    };

    //Query
    const doc = await fauna.query(Create(Collection("views"), { data }));

    res.status(200).json({
      status: 200,
      videoID: videoID,
      level: 1,
      data: {
        data: doc,
        msg: "You Queried a Level 1 View. This means we only recorded the view, not who viewed it",
        expr: "If this is what you meant, well, congrats!",
        sol: "If not, query a level 2",
      },
    });
  } catch (err) {
    res.status(400).json(err);
  }
});

router.post("/view/level-2/:id", async (req, res) => {
  const fauna = client();

  try {
    //In Level 2, we record the view with the userId and name, so that we can do complex queries
    const videoID = req.params.id;
    const userId = req.body.userID;
    const userName = req.body.username;

    //Create Data
    const data = {
      level: 2,
      videoID: videoID,
      userID: userId,
      username: userName,
    };

    //Query
    const doc = await fauna.query(Create(Collection("views"), { data }));

    res.status(200).json({
      status: 200,
      videoID: videoID,
      payload: data,
      level: 2,
      data: {
        data: doc,
      },
    });
  } catch (err) {
    res.status(200).json(err);
  }
});

router.get("/views-on-video/:id", async (req, res) => {
  const fauna = client();

  try {
    //Get Parameters
    const videoID = req.params.id;
    const returnDocs = req.query.returnDocs || "false";

    //Query
    const docs = await fauna.query(
      Paginate(Match(Index("views_by_video"), videoID))
    );

    //Get Length
    const viewCount = docs.data.length;

    if (returnDocs === "true") {
      res.status(200).json({
        status: 200,
        videoID: videoID,
        data: docs,
        viewCount: viewCount,
      });
    } else {
      res.status(200).json({
        status: 200,
        videoID: videoID,
        data: {
          msg: "You asked to not return The individual docs. Hence, we returned only the view count",
          sol: "Add ?returnDocs=true to your query",
        },
        viewCount: viewCount,
      });
    }
  } catch (err) {
    res.status(200).json(err);
  }
});

router.get("/views-of-user/:id", async (req, res) => {
  const fauna = client();

  try {
    //Get Parameters
    const userID = req.params.id;

    //Query
    const docs = await fauna.query(
      Paginate(Match(Index("views_by_user"), userID))
    );

    //Extract the ids
    const extracted = [];
    docs.data.map((e) => {
      extracted.push(e.id);
    });

    //Execute Second Query
    const finalDocs = await fauna.query(
      Map(
        extracted,
        Lambda(
          "id",
          Get(
            Ref(
              Collection("videos"),
              Select(
                "videoID",
                Select("data", Get(Ref(Collection("views"), Var("id"))))
              )
            )
          )
        )
      )
    );

    //Get Length
    const viewCount = docs.data.length;

    res.status(200).json({
      status: 200,
      videoID: userID,
      data: {
        videos: finalDocs,
      },
      viewCount: viewCount,
    });
  } catch (err) {
    res.status(200).json(err);
  }
});

module.exports = router;
