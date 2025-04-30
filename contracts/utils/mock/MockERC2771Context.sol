// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "contracts/utils/ERC2771Context.sol";
import "../../libraries/LibData.sol";
contract MockERC2771Context is ERC2771Context {
    /// @notice For tests only: set the trusted forwarder in storage.
    function setTrustedForwarder(address forwarder) external {
        CPStorage.load().gelatoTrustedForwarder = forwarder;
    }

    /// @notice Expose the internal _msgSender()
    function getMsgSender() external view returns (address) {
        return _msgSender();
    }

    /// @notice Expose the internal _msgData()
    function getMsgData() external view returns (bytes calldata) {
        return _msgData();
    }
}
