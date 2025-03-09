// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/IChallengePool.sol";

import "../interfaces/IPaymaster.sol";
import "../utils/Errors.sol";

import "../libraries/LibData.sol";

import "hardhat/console.sol";

library LibTransfer {
    function _send(address _token, uint256 _amount, address _to) internal {
        uint256 balanceBefore = IERC20(_token).balanceOf(address(this));
        SafeERC20.safeTransfer(IERC20(_token), _to, _amount);
        uint256 balanceAfter = IERC20(_token).balanceOf(address(this));
        if ((balanceBefore - balanceAfter) != _amount) {
            revert ProtocolInvariantCheckFailed();
        }
    }

    function _receive(
        address _token,
        uint256 _amount,
        address _caller
    ) internal {
        uint256 balanceBefore = IERC20(_token).balanceOf(address(this));
        SafeERC20.safeTransferFrom(
            IERC20(_token),
            _caller,
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
        uint256 _amount,
        address _caller
    ) internal {
        uint256 balanceBefore = IERC20(_token).balanceOf(address(this));
        IPaymaster(_paymaster).payFor(_token, _caller, _amount);
        uint256 balanceAfter = IERC20(_token).balanceOf(address(this));
        if ((balanceAfter - balanceBefore) != _amount) {
            revert ProtocolInvariantCheckFailed();
        }
    }

    function _depositOrPaymaster(
        address _paymaster,
        address _token,
        uint256 _amount,
        address _caller
    ) internal {
        if (_paymaster == address(0)) {
            _receive(_token, _amount, _caller);
        } else {
            _depositFromPaymaster(_paymaster, _token, _amount, _caller);
        }
    }

    function _stakeAirDrop(
        address _paymaster,
        address _token,
        address _caller,
        uint256 _maturity
    ) internal {
        if (_paymaster != address(0)) {
            return;
        }
        AirDropStore storage a = AirDropStorage.load();
        console.log('_stakeAirDrop');
        console.log(a.minPoolMaturity);
        console.log(a.minPoolMaturity + block.timestamp);
        console.log(_maturity);
        if (a.minPoolMaturity + block.timestamp > _maturity) {
            return;
        }
        if (a.claimCount[_caller][_token] >= a.maxClaim) {
            return;
        }
        a.claimCount[_caller][_token] += 1;
        IPaymaster(a.paymaster).depositFor(_token, _caller, a.stakeAirDrop);
    }
}
