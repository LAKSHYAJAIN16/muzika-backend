const fauna = require("faunadb");

const getClient = () => {
  const client = new fauna.Client({
    secret: "fnAEbsDDEZAASRtyCAww2f00CJ70muWexBIGjmzv",
    domain: "db.us.fauna.com",
  });
  return client;
};

module.exports = getClient;
