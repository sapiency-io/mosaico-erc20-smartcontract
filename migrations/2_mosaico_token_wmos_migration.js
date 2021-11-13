const wMosContract = artifacts.require("WrappedMosContract");

module.exports = function (deployer) {
  deployer.deploy(wMosContract);
};
