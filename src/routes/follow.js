const router = require("express").Router();
const client = require("../database/fauna-config");
const {
  Create,
  Collection,
  Intersection,
  Get,
  Match,
  Index,
  Paginate,
  Select,
  Map,
  Delete,
  Lambda,
  Var,
  Ref,
} = require("faunadb").query;

router.post("/follow", async (req, res) => {
  const fauna = client();

  try {
    //Extract Data from Response
    const follower = req.body.follower;
    const followee = req.body.followee;

    //Create new Data
    const data = {
      follower: Select(
        "ref",
        Get(Match(Index("user_by_email_main"), follower))
      ),
      followee: Select(
        "ref",
        Get(Match(Index("user_by_email_main"), followee))
      ),
    };

    //Query
    const doc = await fauna.query(
      Create(Collection("follower_to_followee_edge"), { data })
    );

    res.status(200).json(doc);
  } catch (err) {
    res.status(200).json(err);
  }
});

router.post("/unfollow", async (req, res) => {
  const fauna = client();

  try {
    //Extract Data
    const follower = req.body.follower;
    const followee = req.body.followee;
    const authorizeDelete = req.body.authorizeDelete || false;

    //Query
    const doc = await fauna.query(
      Get(
        Intersection(
          Match(
            Index("unfollow_followee"),
            Select("ref", Get(Match(Index("user_by_email_main"), followee)))
          ),
          Match(
            Index("unfollow_follower"),
            Select("ref", Get(Match(Index("user_by_email_main"), follower)))
          )
        )
      )
    );

    if (authorizeDelete === true) {
      const finalQuery = await fauna.query(Delete(Select("ref", doc)));
      res.status(200).json({
        status: 200,
        authorization: true,
        data: finalQuery,
        relationship: doc,
        epoch: "equal",
      });
    } else if (authorizeDelete === false) {
      res.status(200).json({
        status: 200,
        authorization: false,
        msg: "You did not Authorize the Delete Operation. Therefore, we retrieved the Relationship data but did not delete it",
        sol: "Add an authorizeDelete flag in your request, and set it to true",
        data: doc,
      });
    }

  } catch (err) {
    res.status(200).json(err);
  }
});

router.get("/followed-accounts/:id", async (req, res) => {
  const fauna = client();

  try {
    //Get The User we want to query
    const user = req.params.id;

    //Query
    const docs = await fauna.query(
      Paginate(
        Match(
          Index("follower_to_followee_main"),
          Select("ref", Get(Match(Index("user_by_email_main"), user)))
        )
      )
    );

    //Now, extract the id's of the user
    const extracted = [];
    docs.data.map((e) => {
      extracted.push(e.id);
    });

    //Check if we should only return the extracted data or execute a compound query
    const execute_compound = req.query.return_compound || "false";
    if (execute_compound === "false") {
      res.status(200).json({
        Status: 200,
        execute_compound: false,
        data: {
          ids: extracted,
          users: {
            msg: "You Opted to not execute a compound query, therefore only the ids of the users were returned.",
            sol: "If you want the users first, add ?return_compound=true",
          },
        },
      });
    } else if (execute_compound === "true") {
      //Execute second query
      const users = await fauna.query(
        Map(
          extracted,
          Lambda("id", Select("data", Get(Ref(Collection("users"), Var("id")))))
        )
      );

      res.status(200).json({
        Status: 200,
        execute_compound: true,
        data: {
          ids: extracted,
          users: users,
        },
      });
    }
  } catch (err) {
    res.status(400).json(err);
  }
});

module.exports = router;
