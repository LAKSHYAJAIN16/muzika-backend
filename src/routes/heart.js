const router = require("express").Router();
const client = require("../database/fauna-config");

const {
  Get,
  Ref,
  Create,
  Collection,
  Paginate,
  Match,
  Intersection,
  Index,
  Map,
  Lambda,
  Select,
  Var,
  Delete,
} = require("faunadb").query;

router.post("/heart", async (req, res) => {
  const fauna = client();

  try {
    //Get the Body Data
    const videoID = req.body.videoID;
    const userID = req.body.userID;

    //Create the Data
    const data = {
      videoID: videoID,
      userID: userID,
    };

    //Create the Heart Connection
    const doc = await fauna.query(
      Create(Collection("like_to_song_edge"), { data })
    );

    res.status(200).json({
      Status: 200,
      verified: true,
      data: doc,
    });
  } catch (err) {
    res.status(400).json(err);
  }
});

router.post("/un-heart", async (req, res) => {
  const fauna = client();

  try {
    //Get the Body Data
    const videoID = req.body.videoID;
    const userID = req.body.userID;
    const authorizeDelete = req.body.authorizeDelete || false;

    //Query according to the permission
    if (authorizeDelete) {
      const doc = await fauna.query(
        Delete(
          Select(
            "ref",
            Get(
              Intersection(
                Match(Index("unheart_video"), videoID),
                Match(Index("unheart_user"), userID)
              )
            )
          )
        )
      );
      res.status(200).json({
        Status: 200,
        authorizeDelete: authorizeDelete,
        videoID: videoID,
        userID: userID,
        data: doc,
      });
    } else if (!authorizeDelete) {
      const doc = await fauna.query(
        Get(
          Intersection(
            Match(Index("unheart_video"), videoID),
            Match(Index("unheart_user"), userID)
          )
        )
      );

      res.status(200).json({
        Status: 200,
        authorizeDelete: authorizeDelete,
        videoID: videoID,
        userID: userID,
        data: {
          msg: "You did not Authorize the Delete Operation. Therefore, we retrieved the Relationship data but did not delete it",
          sol: "Add an authorizeDelete flag in your request, and set it to true",
          doc: doc,
        },
      });
    }
  } catch (err) {
    res.status(400).json(err);
  }
});

router.get("/hearts-on-video/:id", async (req, res) => {
  const fauna = client();
  try {
    //Get the Data from the body
    const videoID = req.params.id;
    const compound_query = req.query.return_compound || "false";
    const query_level = req.query.level || "1";

    //Query
    const docs = await fauna.query(
      Paginate(Match(Index("heart_to_song_main"), videoID))
    );

    //Extract the ids
    const extracted = [];
    docs.data.map((e) => {
      extracted.push(e.id);
    });

    //Check if we need to execute a compound query
    if (compound_query === "true") {
      if (query_level === "1") {
        //Execute Query
        const finalDocs = await fauna.query(
          Map(
            extracted,
            Lambda(
              "id",
              Select(
                "data",
                Get(Ref(Collection("like_to_song_edge"), Var("id")))
              )
            )
          )
        );
        res.status(200).json({
          status: 200,
          compound_query: true,
          level: query_level,
          ids: extracted,
          raw_data: docs,
          data: finalDocs,
          heartCount: extracted.length,
        });
      } else {
        //Execute First Query
        const finalDocs = await fauna.query(
          Map(
            extracted,
            Lambda(
              "id",
              Select(
                "data",
                Get(Ref(Collection("like_to_song_edge"), Var("id")))
              )
            )
          )
        );

        //Format Data
        const formattedDocs = [];
        finalDocs.map((doc) => {
          formattedDocs.push(doc.userID);
        });

        //Execute Second Query
        const finalFinalDocs = await fauna.query(
          Map(
            formattedDocs,
            Lambda(
              "id",
              Select("data", Get(Ref(Collection("users"), Var("id"))))
            )
          )
        );

        res.status(200).json({
          status: 200,
          compound_query: true,
          level: query_level,
          relationIds: extracted,
          relationIdData: docs,
          userIDS: formattedDocs,
          rawData: finalDocs,
          data: finalFinalDocs,
          heartCount: formattedDocs.length,
        });
      }
    } else if (compound_query === "false") {
      res.status(200).json({
        status: 200,
        compound_query: false,
        level: query_level,
        relationIds: extracted,
        raw_data: docs,
      });
    }
  } catch (err) {
    res.status(400).json(err);
  }
});

module.exports = router;
