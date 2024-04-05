const { MongoClient } = require("mongodb");
const MONGO_URL = process.env.MONGO_URL;

const client = new MongoClient(MONGO_URL);
const docDB = client.db("darwin-docs").collection("documents");

// docDB.deleteMany({"owner": "shiva"})


module.exports = { docDB, client};
