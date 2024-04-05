const { ObjectId } = require("mongodb");
const { docDB } = require("../mongo");

module.exports.create = async (req, res) => {
  try {
    const username = req.body.username;
    if (!username) {
      res.status(204).send({
        success: false,
        error: "no username given, try to login again",
      });
    }
    const docId = await docDB.insertOne({
      docName: "Untitled Document",
      owner: username,
      users: [{ username, permission: 0 }],
    });
    res.send({ success: true, docId: docId.insertedId });
  } catch (e) {
    res.status().send({ success: false, error: e });
  }
};

module.exports.getPermissions = async (req, res) => {
  try {
    const { docId } = req.params;
    if (!docId) {
      res.status(204).send({
        success: false,
        error: "invalid docId",
      });
      return;
    }
    const docRes = await docDB.findOne({ _id: new ObjectId(docId) });
    if (!docRes) {
      res.status(400).send({
        success: false,
        error: "invalid document id",
      });
      return;
    }
    res.send(docRes.users);
  } catch (err) {
    console.log(err);
    res.status(400).send({ success: false, error: "invalid document id" });
  }
};

module.exports.getDocname = async (req, res) => {
  try {
    const { docId } = req.params;
    const docRes = await docDB.findOne(
      { _id: new ObjectId(docId) },
      { projection: { docName: 1, _id: 0 } }
    );
    res.send(docRes);
  } catch (err) {
    console.log(err);
    res.status(400).send({ success: false, error: "internal server error" });
  }
};

module.exports.addPermission = async (req, res) => {
  // try {
  //   const { newUsername, permission, docId } = req.body;
  //   if (!docId) {
  //     res.status(404).send({ success: false, error: "invalid document id" });
  //     return;
  //   }
  //   const found = await userDB.findOne(
  //     { username: newUsername },
  //     { projection: { username: 1, _id: 0 } }
  //   );
  //   if (!found) {
  //     res.status(404).send({ success: false, error: "user not found" });
  //     return;
  //   }
  //   const response = await docDB.updateOne(
  //     { _id: new ObjectId(docId) },
  //     { $push: { users: { username: newUsername, permission } } }
  //   );
  //   if (response.modifiedCount === 0) {
  //     res.status(404).send({ success: false, error: "Inavlid document id" });
  //   } else {
  //     res.send({ success: true });
  //   }
  // } catch (err) {
  //   console.log(err);
  //   res.status(400).send({ success: false, error: "internal server error" });
  // }
};

module.exports.userDocs = async (req, res) => {
  try {
    const { username } = req.body;
    const docs = await docDB.find({ "users.username": username }).toArray();
    res.send(docs);
  } catch (err) {
    console.log(err);
    res.status(400).send({ success: false, error: "internal server error" });
  }
};

module.exports.renameDoc = async (req, res) => {
  try {
    const { docName, _id } = req.body;
    const response = await docDB.updateOne(
      { _id: new ObjectId(_id) },
      { $set: { docName: docName } }
    );
    res.send(response);
  } catch (err) {
    console.log(err);
    res.status(400).send({ success: false, error: "internal server error" });
  }
};
