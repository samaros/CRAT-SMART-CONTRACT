const { expect } = require('chai');
const { BN, expectEvent, expectRevert, makeInterfaceId, time } = require('@openzeppelin/test-helpers');
const { exitCode, hasUncaughtExceptionCaptureCallback } = require('process');
const EthCrypto = require("eth-crypto");
const CRAT = artifacts.require('CRAT');
const CRATPresale = artifacts.require('CRATPresale');
const token = artifacts.require('token');

const MINUS_ONE = new BN(-1);
const ZERO = new BN(0);
const ONE = new BN(1);
const TWO = new BN(2);
const THREE = new BN(3);
const FOUR = new BN(4);
const FIVE = new BN(5);
const SIX = new BN(6);
const SEVEN = new BN(7);
const EIGHT = new BN(8);
const NINE = new BN(9);
const TEN = new BN(10);
const TWENTY = new BN(20);

const DECIMALS = new BN(18);
const ONE_TOKEN = TEN.pow(DECIMALS);
const TWO_TOKEN = ONE_TOKEN.mul(TWO);

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

require('dotenv').config();
const {
    CRAT_DECIMALS,
    CRAT_TOTAL_SUPPLY,
    CRAT_OWNER_AMOUNT,
    CRAT_PRESALE_AMOUNT,
    CRAT_MAXTX,
    CRAT_HOLDER_PERCENT,
    CRAT_BENEFICIARY_PERCENT
} = process.env;

const DEFAULT_TOTAL_AMOUNT = new BN(CRAT_TOTAL_SUPPLY).mul(new BN(10).pow(new BN(CRAT_DECIMALS)));
const DEFAULT_MAXTX = new BN(CRAT_MAXTX).mul(new BN(10).pow(new BN(CRAT_DECIMALS)));

const ONE_CRAT = TEN.pow(new BN(CRAT_DECIMALS));

let signer;
let TOKENONE;
let CRATInst;
let CRATPresaleInst;

contract (
    'CRATPresale',
    ([
        deployer,
        owner,
        beneficiary,
        admin,
        receiver,
        user1,
        user2,
        user3
    ]) => {

        let DEFAULT_ADMIN_ROLE;
        let MINTER_ROLE;

        beforeEach (async () => {

            signer = EthCrypto.createIdentity();

            CRATInst = await CRAT.new(
                "CRAT",
                "CRAT",
                DEFAULT_TOTAL_AMOUNT,
                CRAT_DECIMALS,
                CRAT_HOLDER_PERCENT,
                DEFAULT_MAXTX
            );
            CRATPresaleInst = await CRATPresale.new(
                CRATInst.address, CRAT_DECIMALS
            );

            await CRATInst.excludeFromFee(owner);
            await CRATInst.excludeFromFee(CRATPresaleInst.address);
            await CRATInst.excludeFromReward(CRATPresaleInst.address);
            await CRATInst.setFeeBeneficiary(beneficiary);
            await CRATInst.setToAddressFee(CRAT_BENEFICIARY_PERCENT);
            await CRATInst.excludeFromFee(beneficiary);
            await CRATInst.excludeFromReward(beneficiary);
            await CRATInst.transfer(owner, new BN(CRAT_OWNER_AMOUNT).mul(new BN(10).pow(new BN(CRAT_DECIMALS))));
            await CRATInst.transfer(CRATPresaleInst.address, new BN(CRAT_PRESALE_AMOUNT).mul(new BN(10).pow(new BN(CRAT_DECIMALS))));
            await CRATInst.includeInFee(deployer);
            await CRATInst.transferOwnership(owner);

            await CRATPresaleInst.grantRole(await CRATPresaleInst.DEFAULT_ADMIN_ROLE(), admin);
            await CRATPresaleInst.grantRole(await CRATPresaleInst.SIGNER_ROLE(), signer.address);
            await CRATPresaleInst.setReceiver(receiver);
            await CRATPresaleInst.renounceRole(await CRATPresaleInst.SIGNER_ROLE(), deployer);
            await CRATPresaleInst.renounceRole(await CRATPresaleInst.DEFAULT_ADMIN_ROLE(), deployer);

            TOKENONE = await token.new("TOKENONE", "TKNO");
            await TOKENONE.mint(user1, ONE_TOKEN.mul(new BN(100)));
            await TOKENONE.mint(user2, ONE_TOKEN.mul(new BN(100)));
            await TOKENONE.mint(user3, ONE_TOKEN.mul(new BN(100)));

            await TOKENONE.approve(CRATPresaleInst.address, ONE_TOKEN.mul(new BN(100)), {from: user1});
            await TOKENONE.approve(CRATPresaleInst.address, ONE_TOKEN.mul(new BN(100)), {from: user2});
            await TOKENONE.approve(CRATPresaleInst.address, ONE_TOKEN.mul(new BN(100)), {from: user3});
        })

        it('Valid signature test', async () => {

            await CRATPresaleInst.start({from: admin});

            await time.advanceBlock();
            deadline = ((await time.latest()).add(new BN(60)));
            deadlinestr = deadline.toString();

            message = EthCrypto.hash.keccak256([
                { type: "address", value: TOKENONE.address },
                { type: "uint256", value: "50000000000000000000" },
                { type: "uint256", value: "10000000000" },
                { type: "uint256", value: deadlinestr }
            ]);
            message = EthCrypto.hash.keccak256([
                { type: "string", value: "\x19Ethereum Signed Message:\n32" },
                { type: "bytes32", value: message }
            ]);
            signature = EthCrypto.sign(signer.privateKey, message);

            expect(await CRATInst.balanceOf(user1)).bignumber.equal(ZERO);

            await CRATPresaleInst.buy(TOKENONE.address, ONE_TOKEN.mul(new BN(50)), ONE_CRAT.mul(new BN(100)), deadline, signature, {from: user1});

            expect(await CRATInst.balanceOf(user1)).bignumber.equal(ONE_CRAT.mul(new BN(100)));
            expect(await TOKENONE.balanceOf(receiver)).bignumber.equal(ONE_TOKEN.mul(new BN(50)));
        })

        it('Invalid signature test', async () => {

            await CRATPresaleInst.start({from: admin});

            await time.advanceBlock();
            deadline = ((await time.latest()).add(new BN(60)));
            deadlinestr = deadline.toString();

            message = EthCrypto.hash.keccak256([
                { type: "address", value: TOKENONE.address },
                { type: "uint256", value: "50000000000000000000" },
                { type: "uint256", value: "10000000000" },
                { type: "uint256", value: deadlinestr }
            ]);
            message = EthCrypto.hash.keccak256([
                { type: "string", value: "\x19Ethereum Signed Message:\n32" },
                { type: "bytes32", value: message }
            ]);
            signature = EthCrypto.sign(signer.privateKey, message);

            await expectRevert(
                CRATPresaleInst.buy
                (TOKENONE.address, ONE_CRAT.mul(new BN(100)), ONE_TOKEN.mul(new BN(50)), deadline, signature, {from: user1}),
            "Invalid signature");

            await expectRevert(
                CRATPresaleInst.buy
                (user2, ONE_TOKEN.mul(new BN(50)), ONE_CRAT.mul(new BN(100)), deadline, signature, {from: user1}),
            "Invalid signature");

            await expectRevert(
                CRATPresaleInst.buy
                (TOKENONE.address, ONE_TOKEN.mul(new BN(50)), ONE_CRAT.mul(new BN(100)), deadline.add(TEN), signature, {from: user1}),
            "Invalid signature");
        })

        it('Deadline test', async () => {

            await CRATPresaleInst.start({from: admin});

            await time.advanceBlock();
            deadline = ((await time.latest()).add(new BN(60)));
            deadlinestr = deadline.toString();

            message = EthCrypto.hash.keccak256([
                { type: "address", value: TOKENONE.address },
                { type: "uint256", value: "50000000000000000000" },
                { type: "uint256", value: "10000000000" },
                { type: "uint256", value: deadlinestr }
            ]);
            message = EthCrypto.hash.keccak256([
                { type: "string", value: "\x19Ethereum Signed Message:\n32" },
                { type: "bytes32", value: message }
            ]);
            signature = EthCrypto.sign(signer.privateKey, message);

            await time.increase(time.duration.minutes(1));
            await time.increase(time.duration.seconds(1));

            await expectRevert(
                CRATPresaleInst.buy
                (TOKENONE.address, ONE_TOKEN.mul(new BN(50)), ONE_CRAT.mul(new BN(100)), deadline, signature, {from: user1}), 
            "Deadline passed");
        })

        it('Different exceptions test', async () => {

            await CRATPresaleInst.start({from: admin});

            await time.advanceBlock();
            deadline = ((await time.latest()).add(new BN(60)));
            deadlinestr = deadline.toString();

            message = EthCrypto.hash.keccak256([
                { type: "address", value: TOKENONE.address },
                { type: "uint256", value: "0" },
                { type: "uint256", value: "10000000000" },
                { type: "uint256", value: deadlinestr }
            ]);
            message = EthCrypto.hash.keccak256([
                { type: "string", value: "\x19Ethereum Signed Message:\n32" },
                { type: "bytes32", value: message }
            ]);
            signature = EthCrypto.sign(signer.privateKey, message);

            await expectRevert(
                CRATPresaleInst.buy
                (TOKENONE.address, ZERO, ONE_CRAT.mul(new BN(100)), deadline, signature, {from: user1}), 
            "Cannot pay or receive zero");

            await time.advanceBlock();
            deadline = ((await time.latest()).add(new BN(60)));
            deadlinestr = deadline.toString();

            message = EthCrypto.hash.keccak256([
                { type: "address", value: TOKENONE.address },
                { type: "uint256", value: "50000000000000000000" },
                { type: "uint256", value: "0" },
                { type: "uint256", value: deadlinestr }
            ]);
            message = EthCrypto.hash.keccak256([
                { type: "string", value: "\x19Ethereum Signed Message:\n32" },
                { type: "bytes32", value: message }
            ]);
            signature = EthCrypto.sign(signer.privateKey, message);

            await expectRevert(
                CRATPresaleInst.buy
                (TOKENONE.address, ONE_TOKEN.mul(new BN(50)), ZERO, deadline, signature, {from: user1}), 
            "Cannot pay or receive zero");

            await time.advanceBlock();
            deadline = ((await time.latest()).add(new BN(60)));
            deadlinestr = deadline.toString();

            message = EthCrypto.hash.keccak256([
                { type: "address", value: TOKENONE.address },
                { type: "uint256", value: "50000000000000000000" },
                { type: "uint256", value: "10000000000" },
                { type: "uint256", value: deadlinestr }
            ]);
            message = EthCrypto.hash.keccak256([
                { type: "string", value: "\x19Ethereum Signed Message:\n32" },
                { type: "bytes32", value: message }
            ]);
            signature = EthCrypto.sign(signer.privateKey, message);

            await expectRevert(
                CRATPresaleInst.buy
                (TOKENONE.address, ONE_TOKEN.mul(new BN(50)), ONE_CRAT.mul(new BN(100)), deadline, signature, {from: user1, value: ONE}),
            "Cannot send ETH while paying with token");

            await time.advanceBlock();
            deadline = ((await time.latest()).add(new BN(60)));
            deadlinestr = deadline.toString();

            message = EthCrypto.hash.keccak256([
                { type: "address", value: TOKENONE.address },
                { type: "uint256", value: "50000000000000000000" },
                { type: "uint256", value: "100000100000000" },
                { type: "uint256", value: deadlinestr }
            ]);
            message = EthCrypto.hash.keccak256([
                { type: "string", value: "\x19Ethereum Signed Message:\n32" },
                { type: "bytes32", value: message }
            ]);
            signature = EthCrypto.sign(signer.privateKey, message);

            await expectRevert(
                CRATPresaleInst.buy
                (TOKENONE.address, ONE_TOKEN.mul(new BN(50)), ONE_CRAT.mul(new BN(1000001)), deadline, signature, {from: user1}),
            "Buying surpasses stage limit");
        })

        it('Times test', async () => {

            await time.advanceBlock();
            deadline = ((await time.latest()).add(new BN(60)));
            deadlinestr = deadline.toString();

            message = EthCrypto.hash.keccak256([
                { type: "address", value: TOKENONE.address },
                { type: "uint256", value: "50000000000000000000" },
                { type: "uint256", value: "10000000000" },
                { type: "uint256", value: deadlinestr }
            ]);
            message = EthCrypto.hash.keccak256([
                { type: "string", value: "\x19Ethereum Signed Message:\n32" },
                { type: "bytes32", value: message }
            ]);
            signature = EthCrypto.sign(signer.privateKey, message);

            await expectRevert(
                CRATPresaleInst.buy
                (TOKENONE.address, ONE_TOKEN.mul(new BN(50)), ONE_CRAT.mul(new BN(100)), deadline, signature, {from: user1}),
            "Not started yet");

            await expectRevert(
                CRATPresaleInst.pullToken(receiver, {from: admin}),
            "Not started yet");

            await CRATPresaleInst.start({from: admin});

            await time.advanceBlock();
            deadline = ((await time.latest()).add(new BN(60)));
            deadlinestr = deadline.toString();

            message = EthCrypto.hash.keccak256([
                { type: "address", value: TOKENONE.address },
                { type: "uint256", value: "50000000000000000000" },
                { type: "uint256", value: "10000000000" },
                { type: "uint256", value: deadlinestr }
            ]);
            message = EthCrypto.hash.keccak256([
                { type: "string", value: "\x19Ethereum Signed Message:\n32" },
                { type: "bytes32", value: message }
            ]);
            signature = EthCrypto.sign(signer.privateKey, message);

            await CRATPresaleInst.buy(TOKENONE.address, ONE_TOKEN.mul(new BN(50)), ONE_CRAT.mul(new BN(100)), deadline, signature, {from: user1});

            await expectRevert(
                CRATPresaleInst.pullToken(receiver, {from: admin}),
            "Not ended yet");

            await time.increase(time.duration.weeks(15));
            await time.increase(time.duration.seconds(1));

            await CRATPresaleInst.pullToken(receiver, {from: admin});

            expect(await CRATInst.balanceOf(receiver)).bignumber.equal(ONE_CRAT.mul(new BN(13999900)));
        })
    }
)