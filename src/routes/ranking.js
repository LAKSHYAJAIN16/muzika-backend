const router = require("express").Router();
const client = require("../database/fauna-config");
const { Map, Lambda, Paginate, Collection, Documents, Var, Get } =
  require("faunadb").query;

router.get("/all", async (req, res) => {
  const fauna = client();

  try {
    //Query Compound
    const docs = await fauna.query(
      Map(Paginate(Documents(Collection("users"))), Lambda("x", Get(Var("x"))))
    );

    res.status(200).json(docs);
  } catch (err) {
    res.status(200).json(err);
  }
});
module.exports = router;
