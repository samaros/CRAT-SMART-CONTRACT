const BN = require('bn.js');

require('dotenv').config();
const {
    CRAT_DECIMALS,
    CRAT_TOTAL_SUPPLY,
    CRAT_HOLDER_PERCENT,
    CRAT_MAXTX
} = process.env;

const DeflationaryAutoLPToken = artifacts.require("CRAT");

const DEFAULT_NAME = "CRAT";
const DEFAULT_SYMBOL = "CRAT";
const DEFAULT_TOTAL_AMOUNT = new BN(CRAT_TOTAL_SUPPLY).mul(new BN(10).pow(new BN(CRAT_DECIMALS)));

const DEFAULT_MAXTX = new BN(CRAT_MAXTX).mul(new BN(10).pow(new BN(CRAT_DECIMALS))); // max transaction amount 5 * 10**21


module.exports = async function (deployer, network) {
    if (network == "test" || network == "development")
        return;

    await deployer.deploy(
        DeflationaryAutoLPToken,
        DEFAULT_NAME,
        DEFAULT_SYMBOL,
        DEFAULT_TOTAL_AMOUNT,
        CRAT_DECIMALS,
        CRAT_HOLDER_PERCENT,
        DEFAULT_MAXTX
    );


    let DeflationaryAutoLPTokenInst = await DeflationaryAutoLPToken.deployed();
    console.log("CRAT = ", DeflationaryAutoLPTokenInst.address);
};