// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @author  .
 * @title   .
 * @dev     A contract that can pay for your challenge pool stake
 * @notice  .
 */

interface IPaymaster {
    event Pay (
        address token,
        address sender,
        address from,
        address to,
        uint256 amount
    );

    event Deposit (
        address token,
        address sender,
        address from,
        address to,
        uint256 amount
    );
    /**
     * @notice  .
     * @dev     custodial requests paymaster to pay for _owner
     * @param   _owner  .
     * @param   _amt  .
     * @param   _token  .
     */
    function payFor(address _token, address _owner, uint256 _amt) external;
    /**
     * @notice  .
     * @dev     give consent to a custodial to ask pay master to payFor
     * @param   _custodial  .
     * @param   _amt  .
     * @param   _token  .
     */
    function consent(address _token, address _custodial, uint256 _amt) external;
    /**
     * @notice  .
     * @dev     deposit into your paymaster account
     * @param   _amt  .
     * @param   _token  .
     */
    function deposit(address _token, uint256 _amt) external;
    /**
     * @notice  .
     * @dev     withdraw from your paymaster account
     * @param   _amt  .
     * @param   _token  .
     */
    function withdraw(address _token, uint256 _amt) external;
    /**
     * @notice  .
     * @dev     deposit tokens for an addr, this is usefull for airdrop functionality
     * @param   _token  .
     * @param   _addr  .
     * @param   _amt  .
     */
    function depositFor(address _token, address _addr, uint256 _amt) external;

    function balance(address _token, address _owner) external returns(uint256);

    function allowance(address _token, address _owner, address _custodial) external returns(uint256);
}
