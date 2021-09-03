// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract CRATPresale is AccessControl, ReentrancyGuard {

    bytes32 public constant SIGNER_ROLE = keccak256("SIGNER_ROLE");

    IERC20 public immutable CRAT;

    address public receiver;
 
    constructor(address _CRAT) {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(SIGNER_ROLE, _msgSender());
        CRAT = IERC20(_CRAT);
    }

    function buy(address tokenToPay, uint256 amountToPay, uint256 amountToReceive, uint256 endTime, bytes calldata signature) external payable nonReentrant {
        require(hasRole(SIGNER_ROLE, ECDSA.recover(keccak256(abi.encodePacked(tokenToPay, amountToPay, amountToReceive, endTime)), signature)));
        require(endTime >= block.timestamp);
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
    }

    function setReceiver(address _receiver) external onlyRole(DEFAULT_ADMIN_ROLE) {
        receiver = _receiver;
    }
}