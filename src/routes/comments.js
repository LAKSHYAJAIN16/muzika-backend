const router = require("express").Router();
const client = require("../database/fauna-config");
const {
  Create,
  Collection,
  Intersection,
  Get,
  Ref,
  Delete,
  Select,
  Update,
  Paginate,
  Match,
  Index,
  Map,
  Var,
  Lambda,
} = require("faunadb").query;

router.post("/create", async (req, res) => {
  const fauna = client();

  try {
    //Get the Data from the Body
    const userID = req.body.userID;
    const videoID = req.body.videoID;
    const timestamp = req.body.timestamp;
    const commentText = req.body.commentText;
    const username = req.body.username;
    const profilePic = req.body.profilePic;

    //Format it into a data object
    const data = {
      userID,
      videoID,
      timestamp,
      commentText,
      profilePic,
      username
    };

    //Query (create document in the comments collection)
    const doc = await fauna.query(Create(Collection("comments"), { data }));

    res.status(200).json({
      status: 200,
      data: doc,
      payload: data,
    });
  } catch (err) {
    res.status(400).json(err);
  }
});

router.delete("/delete/:id", async (req, res) => {
  const fauna = client();

  try {
    //Get the data
    const id = req.params.id;
    const authorizeDelete = req.query.authorizeDelete || "false";

    if (authorizeDelete === "false") {
      //Query
      const doc = await fauna.query(Get(Ref(Collection("comments"), id)));

      res.status(200).json({
        status: 200,
        authorizeDelete: false,
        data: {
          msg: "You did not Authorize the Delete Operation. Therefore, we retrieved the Relationship data but did not delete it",
          sol: "Add an authorizeDelete flag in your request, and set it to true",
          data: doc,
        },
      });
    } else if (authorizeDelete === "true") {
      //Query
      const doc = await fauna.query(
        Delete(Select("ref", Get(Ref(Collection("comments"), id))))
      );

      res.status(200).json({
        status: 200,
        authorizeDelete: true,
        data: doc,
      });
    }
  } catch (err) {
    res.status(200).json(err);
  }
});

router.put("/update/:id", async (req, res) => {
  const fauna = client();

  try {
    //Get the data
    const id = req.params.id;
    const userID = req.body.userID || null;
    const videoID = req.body.videoID || null;
    const timestamp = req.body.timestamp || null;
    const commentText = req.body.commentText || null;
    const username = req.body.username || null;
    const profilePic = req.body.profilePic || null;

    //Make sure that if the data is null, don't add it to the data obj
    const data = {};
    if (userID !== null) {
      data.userID = userID;
    }
    if (videoID !== null) {
      data.videoID = videoID;
    }
    if (timestamp !== null) {
      data.timestamp = timestamp;
    }
    if (commentText !== null) {
      data.commentText = commentText;
    }
    if (username !== null) {
      data.username = username;
    }
    if (profilePic !== null) {
      data.profilePic = profilePic;
    }

    //Query
    const doc = await fauna.query(
      Update(Ref(Collection("comments"), id), { data })
    );

    res.status(200).json({
      status: 200,
      approved: true,
      data: doc,
      payload: data,
    });
  } catch (err) {
    res.status(200).json(err);
  }
});

router.get("/comments-by-video/:id", async (req, res) => {
  const fauna = client();

  try {
    //Get Data
    const id = req.params.id;

    //Query
    const docs = await fauna.query(
      Paginate(Match(Index("comment_by_video"), id))
    );

    //Extract the ids
    const extracted = [];
    docs.data.map((e) => {
      extracted.push(e.id);
    });

    //Execute map query
    const finalQuery = await fauna.query(
      Map(extracted, Lambda("id", Get(Ref(Collection("comments"), Var("id")))))
    );

    res.status(200).json({
      status: 200,
      videoID: id,
      ids: extracted,
      data: finalQuery,
    });
  } catch (err) {
    res.status(200).json(err);
  }
});

router.get("/comments-by-user/:id", async (req, res) => {
  const fauna = client();

  try {
    //Get Data
    const id = req.params.id;

    //Query
    const docs = await fauna.query(
      Paginate(Match(Index("comment_by_user"), id))
    );

    //Extract the ids
    const extracted = [];
    docs.data.map((e) => {
      extracted.push(e.id);
    });

    //Execute map query
    const finalQuery = await fauna.query(
      Map(extracted, Lambda("id", Get(Ref(Collection("comments"), Var("id")))))
    );

    res.status(200).json({
      status: 200,
      videoID: id,
      ids: extracted,
      data: finalQuery,
    });
  } catch (err) {
    res.status(200).json(err);
  }
});

router.get("/comments-by-user-on-video", async (req, res) => {
  const fauna = client();

  try {
    //Get Data
    const userId = req.query.userID || "";
    const videoId = req.query.videoID || "";

    //Query
    const docs = await fauna.query(
      Paginate(
        Intersection(
          Match(Index("comment_by_user"), userId),
          Match(Index("comment_by_video"), videoId)
        )
      )
    );

    //Extract the ids
    const extracted = [];
    docs.data.map((e) => {
      extracted.push(e.id);
    });

    //Execute map query
    const finalQuery = await fauna.query(
      Map(extracted, Lambda("id", Get(Ref(Collection("comments"), Var("id")))))
    );

    res.status(200).json({
      status: 200,
      videoId: videoId,
      userId: userId,
      ids: extracted,
      data: finalQuery,
    });
  } catch (err) {
    res.status(200).json(err);
  }
});

router.get("/options", async (req, res) => {
  res.status(200).json({
    status: 200,
    options: [
      "You can Create a Comment with the /create endpoint",
      "You can Delete a comment with the /delete/:id endpoint",
      "You can Update a comment with the /update/:id endpoint",
      "You can Get all comments by a specific user with the /comments-by-user/:id endpoint",
      "You can Get all comments on a specific video with the /comments-by-user/:id endpoint",
      "You can Get all comments by a specific user on a specific video with the /comments-by-user-on-video endpoint",
    ],
  });
});

module.exports = router;
