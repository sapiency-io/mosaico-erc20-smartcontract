const MosaicoContract = artifacts.require("MosaicoContract");

module.exports = function (deployer) {
  deployer.deploy(MosaicoContract);
};
