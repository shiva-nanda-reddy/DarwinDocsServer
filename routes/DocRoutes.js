const router = require("express").Router();
const { ObjectId } = require("mongodb");
const { docD } = require("../mongo");
const {
  create,
  getPermissions,
  addPermission,
  getDocname,
  renameDoc,
  userDocs,
} = require("../controllers/DocController");

/* 
Permissions:
0 => owner
1 => admin
2 => editor
3 => reader
*/
router.post("/create", create);

router.get("/permissions/:docId", getPermissions);

router.get("/docname/:docId", getDocname);

router.post("/addpermission", addPermission);

router.post("/userdocs", userDocs);

router.post("/renamedoc", renameDoc);

module.exports = router;
