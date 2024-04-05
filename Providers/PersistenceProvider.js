const Y = require("yjs");
const { uploadToS3, getFromS3 } = require("./AWSProvider");
const { encoding, decoding } = require("lib0");
const { fromUint8Array, toUint8Array } = require("js-base64");

class PersistenceProvider {
  constructor(name) {
    this.name = name;
    this.transaction = Promise.resolve();
    this.updates = {};
    this.state = {};
  }
  transact = (f) => {
    const currentTransaction = this.transaction;
    this.transaction = (async () => {
      await currentTransaction;
      let res = null;
      try {
        res = await f();
      } catch (err) {
        console.log(err);
      }
      return res;
    })();
    return this.transaction;
  };

  clearUpdates = (docName, from, to) => {
    // console.log("updates", this.updates[docName], docName);
    this.updates[docName] = this.updates[docName]?.filter(
      (update) => update.clock < to && update.clock >= from
    );
  };
  getClock = (docName) => {
    // console.log("clock", docName);
    if (this.updates[docName]?.length > 0) {
      return this.updates[docName][this.updates[docName].length - 1].clock;
    }
    return -1;
  };
  getUpdates = async (docName) => {
    if (!this.updates[docName]) this.updates[docName] = [];
    return this.updates[docName].map((update) => update.update);
  };

  flushDoc = async (docName) => {
    try {
      const updates = await this.getUpdates(docName);
      const ydoc = new Y.Doc();
      ydoc.transact(() => {
        updates.map((update) => Y.applyUpdate(ydoc, update));
      });
      const stateVector = Y.encodeStateAsUpdate(ydoc);

      this.state[docName] = stateVector;
      await uploadToS3(docName, this.encodeStateVector(stateVector));
      this.clearUpdates(docName);
    } catch (err) {
      console.log(err);
      const ydoc = new Y.Doc();
      return Y.encodeStateAsUpdate(ydoc);
    }
  };

  storeUpdate = async (docName, update) => {
    return this.transact(async () => {
      this.updates[docName].push({ update, clock: this.getClock(docName) + 1 });
      console.log("updates array length", this.updates[docName].length);
      if (this.updates[docName]?.length > 10000) {
        await this.flushDoc(docName);
      }
    });
  };

  getStateUpdate = async (docName) => {
    try {
      const stateVectorRes = await getFromS3(docName);
      if (!stateVectorRes) {
        const ydoc = new Y.Doc();
        return Y.encodeStateAsUpdate(ydoc);
      }

      const encodedBuf = (await stateVectorRes.toArray())[0];
      const buf = Buffer.from(encodedBuf);
      // console.log("got", buf);

      const stateVector = toUint8Array(buf.toString("base64"));
      return stateVector;
    } catch (err) {
      console.log(err);
      const ydoc = new Y.Doc();
      return Y.encodeStateAsUpdate(ydoc);
    }
  };

  encodeStateVector = (sv) => {
    const buf = Buffer.from(sv);
    return buf;
  };

  decodeStateVector = (buf) => {
    const decoder = decoding.createDecoder(buf);
    const sv = decoding.readVarUint8Array(decoder);
    // console.log("returing", sv);
    return sv;
  };
  getYDoc = (docName) => {
    try {
      return this.transact(async () => {
        const updates = await this.getUpdates(docName);
        const stateUpdate = await this.getStateUpdate(docName);
        const ydoc = new Y.Doc();
        //   console.log("here state update", stateUpdate);
        Y.applyUpdate(ydoc, stateUpdate);
        ydoc.transact(() => {
          updates.map((update) => Y.applyUpdate(ydoc, update));
        });
        //   console.log("here", Y.encodeStateAsUpdate(ydoc));
        return ydoc;
      });
    } catch (err) {
      console.log(err);
      const ydoc = new Y.Doc();
      return Y.encodeStateAsUpdate(ydoc);
    }
  };
}

module.exports = PersistenceProvider;
