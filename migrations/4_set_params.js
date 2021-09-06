const BN = require('bn.js');

require('dotenv').config();

const {
    CRAT_OWNER,
    CRAT_BENEFICIARY,
    CRAT_BENEFICIARY_PERCENT,
    CRAT_DECIMALS,
    CRAT_OWNER_AMOUNT,
    CRAT_PRESALE_AMOUNT,
    PRESALE_ADMIN,
    PRESALE_SIGNER,
    PRESALE_RECEIVER,
    DEPLOYER_ADDRESS
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
    let CRATPresaleInst = await CRATPresale.deployed();
    await CRATInst.excludeFromFee(CRAT_OWNER);
    await CRATInst.excludeFromFee(CRATPresaleInst.address);
    await CRATInst.excludeFromReward(CRATPresaleInst.address);
    await CRATInst.setFeeBeneficiary(CRAT_BENEFICIARY);
    await CRATInst.setToAddressFee(CRAT_BENEFICIARY_PERCENT);
    await CRATInst.excludeFromFee(CRAT_BENEFICIARY);
    await CRATInst.excludeFromReward(CRAT_BENEFICIARY);
    await CRATInst.transfer(CRAT_OWNER, new BN(CRAT_OWNER_AMOUNT).mul(new BN(10).pow(new BN(CRAT_DECIMALS))));
    await CRATInst.transfer(CRATPresaleInst.address, new BN(CRAT_PRESALE_AMOUNT).mul(new BN(10).pow(new BN(CRAT_DECIMALS))));
    await CRATInst.includeInFee(DEPLOYER_ADDRESS);
    await CRATInst.transferOwnership(CRAT_OWNER);

    await CRATPresaleInst.grantRole(await CRATPresaleInst.DEFAULT_ADMIN_ROLE(), PRESALE_ADMIN);
    await CRATPresaleInst.grantRole(await CRATPresaleInst.SIGNER_ROLE(), PRESALE_SIGNER);
    await CRATPresaleInst.setReceiver(PRESALE_RECEIVER);
    await CRATPresaleInst.renounceRole(await CRATPresaleInst.SIGNER_ROLE(), DEPLOYER_ADDRESS);
    await CRATPresaleInst.renounceRole(await CRATPresaleInst.DEFAULT_ADMIN_ROLE(), DEPLOYER_ADDRESS);
};