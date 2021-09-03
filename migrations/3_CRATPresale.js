const BN = require('bn.js');

require('dotenv').config();

const {
} = process.env;

const CRAT = artifacts.require("CRAT");
const CRATPresale = artifacts.require("CRATPresale");

const debug = "true";

const ZERO = new BN(0);
const ONE = new BN(1);
const TWO = new BN(2);
const THREE = new BN(3);

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

module.exports = async function (deployer, network) {
    if (network == "test" || network == "development")
        return;
    let CRATInst = await CRAT.deployed();
    await deployer.deploy(
        CRATPresale, CRATInst.address
    );
    let CRATPresaleInst = await CRATPresale.deployed();
    console.log("CRATPresale =", CRATPresaleInst.address);
};