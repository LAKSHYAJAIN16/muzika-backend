const router = require("express").Router();
const client = require("../database/fauna-config");

const {
  Paginate,
  Match,
  Index,
  Map,
  Lambda,
  Var,
  Get,
  Ref,
  Collection,
  Select,
} = require("faunadb").query;

router.get("/:id", async (req, res) => {
  const fauna = client();

  try {
    //Get ID
    const id = req.params.id;

    //Query
    const docs = await fauna.query(
      Map(
        Paginate(Match(Index("history_by_user"), id)),
        Lambda(
          "id",
          Select(
            "information",
            Select("data", Get(Ref(Collection("videos"), Var("id"))))
          )
        )
      )
    );

    res.status(200).json({
      status: 200,
      userID: id,
      data: docs,
    });
  } catch (err) {
    res.status(200).json(err);
  }
});

module.exports = router;
