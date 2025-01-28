// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@solidstate/contracts/security/pausable/Pausable.sol";

import "../interfaces/SoccersmRoles.sol";

contract PausableFacet is Pausable, SoccersmRoles {
    function pause() external onlyAdmin {
        _pause();
    }

    function unpause() external onlyAdmin {
        _unpause();
    }
}
