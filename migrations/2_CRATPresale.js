const BN = require('bn.js');

require('dotenv').config();

const {
    CRAT_ADDRESS
} = process.env;

const CRATPresale = artifacts.require("CRATPresale");

const debug = "true";

const ZERO = new BN(0);
const ONE = new BN(1);
const TWO = new BN(2);
const THREE = new BN(3);

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

module.exports = async function (deployer, network) {
    await deployer.deploy(
        CRATPresale, CRAT_ADDRESS
    );
    let CRATPresaleInst = await CRATPresale.deployed();
    console.log("CRATPresale =", CRATPresaleInst.address);
};