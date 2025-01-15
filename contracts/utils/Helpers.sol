// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/math/Math.sol";

library HelpersLib {
    bytes internal constant emptyBytes = "";
    bytes internal constant yes = abi.encode("yes");
    bytes internal constant no = abi.encode("no");
    // @dev computes fraction of [value] in [bps]
    // 100 bps is equivalent to 1%
    function basisPoint(
        uint256 value,
        uint256 bps
    ) internal pure returns (uint256) {
        require((value * bps) >= 10_000);
        return Math.mulDiv(value, bps, 10_000);
    }

    function compareStrings(
        string memory a,
        string memory b
    ) internal pure returns (bool) {
        return (keccak256(abi.encodePacked((a))) ==
            keccak256(abi.encodePacked((b))));
    }
    /**
     * @notice  .
     * @dev     compare two bytes.
     * @param   _bytes1  .
     * @param   _bytes2  .
     * @return  bool  true if the are same.
     */
    function compareBytes(
        bytes memory _bytes1,
        bytes memory _bytes2
    ) internal pure returns (bool) {
        if (_bytes1.length != _bytes2.length) {
            return false;
        }
        return keccak256(_bytes1) == keccak256(_bytes2);
    }

    function yesNoOptions() internal pure returns (bytes[] memory yesNo) {
        yesNo[0] = yes;
        yesNo[1] = no;
    }
}

abstract contract Helpers {
    bytes internal constant emptyBytes = "";
    bytes internal constant yes = abi.encode("yes");
    bytes internal constant no = abi.encode("no");
    string internal constant ABOVE = "above";
    string internal constant BELOW = "below";
    string internal constant HOME = "home";
    string internal constant AWAY = "away";
    string internal constant DRAW = "draw";
    string internal constant HOME_AWAY = "home-away";
    string internal constant HOME_DRAW = "home-draw";
    string internal constant AWAY_DRAW = "away-draw";
    string internal constant OVER = "over";
    string internal constant UNDER = "under";
    string internal constant IN = "in";
    string internal constant OUT = "out";

    error EmptyString();
    error EmptyBytes();
    error ZeroAddress();
    error ZeroNumber();

    modifier positiveAddress(address addr) {
        if (address(0) == addr) {
            revert ZeroAddress();
        }
        _;
    }

    modifier nonEmptyString(string memory str) {
        if (bytes(str).length == 0) {
            revert EmptyString();
        }
        _;
    }

    modifier nonEmptyBytes(bytes memory bte) {
        if (bte.length == 0) {
            revert EmptyBytes();
        }
        _;
    }

    modifier nonZero(uint256 num) {
        if (num == 0) {
            revert ZeroNumber();
        }
        _;
    }

    // @dev computes fraction of [value] in [bps]
    // 100 bps is equivalent to 1%
    function basisPoint(
        uint256 value,
        uint256 bps
    ) internal pure returns (uint256) {
        require((value * bps) >= 10_000);
        return Math.mulDiv(value, bps, 10_000);
    }

    function compareStrings(
        string memory a,
        string memory b
    ) internal pure returns (bool) {
        return (keccak256(abi.encodePacked((a))) ==
            keccak256(abi.encodePacked((b))));
    }
    /**
     * @notice  .
     * @dev     compare two bytes.
     * @param   _bytes1  .
     * @param   _bytes2  .
     * @return  bool  true if the are same.
     */
    function compareBytes(
        bytes memory _bytes1,
        bytes memory _bytes2
    ) internal pure returns (bool) {
        if (_bytes1.length != _bytes2.length) {
            return false;
        }
        return keccak256(_bytes1) == keccak256(_bytes2);
    }

    function yesNoOptions() internal pure returns (bytes[] memory) {
        bytes[] memory yesNo = new bytes[](2);
        yesNo[0] = yes;
        yesNo[1] = no;
        return yesNo;
    }
}