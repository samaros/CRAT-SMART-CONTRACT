// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract CRATPresale is AccessControl, ReentrancyGuard {

    bytes32 public constant SIGNER_ROLE = keccak256("SIGNER_ROLE");

    uint256[8] public STAGES;
    uint256[8] public LIMITS = [5, 10, 15, 20, 30, 20, 20, 20];
    uint256[8] public amounts;

    IERC20 public immutable CRAT;
    uint256 private immutable CRAT_DECIMALS;

    address public receiver;
    uint256 public startTime;

    modifier onlyWhenStarted() {
        require(startTime != 0, "Not started yet");
        _;
    }
 
    constructor(address _CRAT, uint256 _CRAT_DECIMALS) {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(SIGNER_ROLE, _msgSender());
        CRAT = IERC20(_CRAT);
        CRAT_DECIMALS = _CRAT_DECIMALS;
    }

    function allStages() external view returns (uint256[8] memory) {
        return STAGES;
    }

    function allLimits() external view returns (uint256[8] memory) {
        return LIMITS;
    }

    function allAmounts() external view returns (uint256[8] memory) {
        return amounts;
    }

    function start() external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(startTime == 0, "Already started");
        uint256 time = block.timestamp;
        startTime = time;
        for (uint256 i = 0; i < 8; i++) {
            time += 1209600;
            if (i == 1 || i == 4) {
                time += 302400;
            }
            if (i < 2) {
                time -= 604800;
            }
            STAGES[i] = time;
        }
    }

    function pullToken(address toSend) external onlyRole(DEFAULT_ADMIN_ROLE) onlyWhenStarted nonReentrant {
        require(block.timestamp > STAGES[7], "Not ended yet");
        CRAT.transfer(toSend, CRAT.balanceOf(address(this)));
    }

    function buy(address tokenToPay, uint256 amountToPay, uint256 amountToReceive, uint256 endTime, bytes calldata signature) external payable onlyWhenStarted nonReentrant {
        require(hasRole(SIGNER_ROLE, ECDSA.recover(ECDSA.toEthSignedMessageHash(keccak256(abi.encodePacked(tokenToPay, amountToPay, amountToReceive, endTime))), signature)), "Invalid signature");
        require(endTime >= block.timestamp, "Deadline passed");
        require(amountToPay > 0 && amountToReceive > 0, "Cannot pay or receive zero");
        if (tokenToPay == 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE) {
            require(amountToPay == msg.value);
            payable(receiver).transfer(msg.value);
        }
        else {
            require(msg.value == 0, "Cannot send ETH while paying with token");
            require(IERC20(tokenToPay).transferFrom(_msgSender(), receiver, amountToPay));
        }
        require(CRAT.transfer(_msgSender(), amountToReceive));
        uint256 stage = determineStage();
        amounts[stage] += amountToReceive;
        require(amounts[stage] <= LIMITS[stage] * (10 ** (CRAT_DECIMALS + 5)), "Buying surpasses stage limit");
    }

    function setReceiver(address _receiver) external onlyRole(DEFAULT_ADMIN_ROLE) {
        receiver = _receiver;
    }

    function determineStage() public view returns (uint256) {
        for (uint256 i = 0; i < 8; i++) {
            if (block.timestamp <= STAGES[i]) {
                return i;
            }
        }
        return 8;
    }
}