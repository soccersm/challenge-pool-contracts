// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/IChallengePool.sol";

import "../interfaces/IPaymaster.sol";
import "../utils/Errors.sol";

library LibTransfer {
    function _send(address _token, uint256 _amount, address _to) internal {
        uint256 balanceBefore = IERC20(_token).balanceOf(address(this));
        SafeERC20.safeTransfer(IERC20(_token), _to, _amount);
        uint256 balanceAfter = IERC20(_token).balanceOf(address(this));
        if ((balanceBefore - balanceAfter) != _amount) {
            revert ProtocolInvariantCheckFailed();
        }
    }

    function _receive(address _token, uint256 _amount) internal {
        uint256 balanceBefore = IERC20(_token).balanceOf(address(this));
        SafeERC20.safeTransferFrom(
            IERC20(_token),
            msg.sender,
            address(this),
            _amount
        );
        uint256 balanceAfter = IERC20(_token).balanceOf(address(this));
        if ((balanceAfter - balanceBefore) != _amount) {
            revert ProtocolInvariantCheckFailed();
        }
    }

    function _depositFromPaymaster(
        address _paymaster,
        address _token,
        uint256 _amount
    ) internal {
        uint256 balanceBefore = IERC20(_token).balanceOf(address(this));
        IPaymaster(_paymaster).payFor(_token, msg.sender, _amount);
        uint256 balanceAfter = IERC20(_token).balanceOf(address(this));
        if ((balanceAfter - balanceBefore) != _amount) {
            revert ProtocolInvariantCheckFailed();
        }
    }

    function _depositOrPaymaster(
        address _paymaster,
        address _token,
        uint256 _amount
    ) internal {
        if (_paymaster == address(0)) {
            _receive(_token, _amount);
        } else {
            _depositFromPaymaster(_paymaster, _token, _amount);
        }
    }
}
