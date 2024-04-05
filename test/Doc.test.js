const chai = require("chai");
const expect = chai.expect;
const sinon = require("sinon");
const sinonChai = require("sinon-chai");
chai.use(sinonChai);
const app = require("../index");
const { client } = require("../mongo");
const rewire = require("rewire");

const docController = rewire("../controllers/DocController.js");

const sandbox = sinon.createSandbox();

describe("Testing document controller", () => {
  let db;

  before(async () => {
    db = client.db("testDB");
    docController.__set__("docDB", db.collection("docs"));
    docController.__set__("userDB", db.collection("users"));
  });

  beforeEach(async () => {
    // Clearing collections before each test

    await db.collection("docs").deleteMany({});
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("create function", () => {
    it("should return 204 status if no username given", async () => {
      const req = { body: {} };
      const res = { status: sinon.stub().returnsThis(), send: sinon.spy() };

      await docController.create(req, res);

      expect(res.status).to.have.been.calledWith(204);
      expect(res.send).to.have.been.calledWith({
        success: false,
        error: "no username given, try to login again",
      });
    });
  });
  describe("getPermissions function", () => {
    it("should return 204 status if no docId given", async () => {
      const req = { params: {} };
      const res = { status: sinon.stub().returnsThis(), send: sinon.spy() };

      await docController.getPermissions(req, res);

      expect(res.status).to.have.been.calledWith(204);
      expect(res.send).to.have.been.calledWith({
        success: false,
        error: "invalid docId",
      });
    });

    it("should return 400 status if docId is invalid", async () => {
      const req = { params: { docId: "invalidDocId" } };
      const res = { status: sinon.stub().returnsThis(), send: sinon.spy() };

      await docController.getPermissions(req, res);

      expect(res.status).to.have.been.calledWith(400);
      expect(res.send).to.have.been.calledWith({
        success: false,
        error: "invalid document id",
      });
    });

  });

  describe("getDocname function", () => {
    it("should return the document name", async () => {
      const docId = "6096ca51e2e82377d1e4c551"; // Sample document ID
      const req = { params: { docId } };
      const expectedDocName = "Sample Document";
      const docRes = { docName: expectedDocName };

      // Stub the findOne method of docDB to return the expected document name
      const findOneStub = sandbox.stub().resolves(docRes);
      docController.__set__("docDB", { findOne: findOneStub });

      const res = { send: sinon.spy() };

      await docController.getDocname(req, res);

      expect(res.send).to.have.been.calledWith(docRes);
    });

  });

  describe("addPermission function", () => {
    it("should return 404 status if no docId given", async () => {
      const req = { body: { newUsername: "testUser", permission: 1 } };
      const res = { status: sinon.stub().returnsThis(), send: sinon.spy() };

      await docController.addPermission(req, res);

      expect(res.status).to.have.been.calledWith(404);
      expect(res.send).to.have.been.calledWith({
        success: false,
        error: "invalid document id",
      });
    });

  });



  describe("renameDoc function", () => {
    it("should rename the document", async () => {
      const req = {
        body: { _id: "6096ca51e2e82377d1e4c551", docName: "New Name" },
      };
      const response = { modifiedCount: 1 }; // Simulate successful rename operation

      // Stub the updateOne method of docDB to return the modifiedCount
      const updateOneStub = sandbox.stub().resolves(response);
      docController.__set__("docDB", { updateOne: updateOneStub });

      const res = { send: sinon.spy() };

      await docController.renameDoc(req, res);

      expect(res.send).to.have.been.calledWith(response);
    });

  });
});
