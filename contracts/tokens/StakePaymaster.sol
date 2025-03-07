// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IPaymaster.sol";
import "../libraries/LibTransfer.sol";
import "../utils/Errors.sol";

contract StakePaymaster is IPaymaster, Ownable {
    mapping(address => mapping(address => uint256)) private _balance; // token -> user -> balance
    mapping(address => mapping(address => mapping(address => uint256)))
        public allowance; // token -> user -> custodial -> allowance

    address public soccersm;

    event SoccersmSet(address caller, address soccersm);
    event Drain(address caller, address token, uint256 amount);

    constructor(address _soccersm) Ownable(msg.sender) {
        soccersm = _soccersm;
    }

    function balance(
        address _token,
        address _owner
    ) public view returns (uint256) {
        uint256 bal = IERC20(_token).balanceOf(address(this));
        return Math.min(bal, _balance[_token][_owner]);
    }

    function payFor(
        address _token,
        address _owner,
        uint256 _amt
    ) external override {
        require(msg.sender == soccersm, "Must be soccersm ...");
        require(balance(_token, _owner) >= _amt, "low balance ...");
        _balance[_token][_owner] -= _amt;
        LibTransfer._send(_token, _amt, msg.sender);
        emit Pay(_token, msg.sender, _owner, msg.sender, _amt);
    }

    function depositFor(
        address _token,
        address _addr,
        uint256 _amt
    ) external override {
        require(
            msg.sender == soccersm || msg.sender == owner(),
            "Must be soccersm or owner ..."
        );
        _balance[_token][_addr] += _amt;
        emit Deposit(_token, msg.sender, msg.sender, _addr, _amt);
    }

    function drain(address _token) external onlyOwner {
        uint256 bal = IERC20(_token).balanceOf(address(this));
        SafeERC20.safeTransfer(IERC20(_token), owner(), bal);
        emit Drain(msg.sender, _token, bal);
    }

    function setSoccersm(address _soccersm) external onlyOwner {
        soccersm = _soccersm;
        emit SoccersmSet(msg.sender, _soccersm);
    }

    function consent(
        address /*_token*/,
        address /*_custodial*/,
        uint256 /*_amt*/
    ) external pure override {
        revert NotImplemented();
    }

    function deposit(
        address /*_token*/,
        uint256 /*_amt*/
    ) external pure override {
        revert NotImplemented();
    }

    function withdraw(
        address /*_token*/,
        uint256 /*_amt*/
    ) external pure override {
        revert NotImplemented();
    }
}
