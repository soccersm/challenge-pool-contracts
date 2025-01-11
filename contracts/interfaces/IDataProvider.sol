// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IDataProvider {
    struct DataRequest {
        bytes requested;
        bytes provided;
        uint256 lastProvidedTime;
        bool register;
    }
    event DataRequested(
        address indexed caller,
        string indexed namespace,
        bytes requestId,
        bytes params
    );
    event DataProvided(
        address indexed caller,
        string indexed namespace,
        bytes requestId,
        bytes params
    );
    event DataRegistered(
        address indexed caller,
        string indexed namespace,
        bytes requestId,
        bytes params
    );
    /**
     * @notice  .
     * @dev     used to make data request to offchain listeners.
     * @param   _params  decoded and sent based on the event topic type.
     */
    function requestData(bytes calldata _params) external returns (bool);
    /**
     * @notice  can only be called by registered oracle
     * @dev     offchain oracles call this to provide initially requested data.
     * @param   _params  decoded and applied based on the event topic type.
     */
    function provideData(bytes calldata _params) external;
    /**
     * @notice  can only be called by soccersm council
     * @dev     in case of dispute and wrong data provided, this can be called to provide correct data.
     * @param   _params  decoded and applied based on the event topic type.
     */
    function updateProvision(bytes calldata _params) external;
    /**
     * @notice  .
     * @dev     sometimes events need to be registered onchain ahead of time before they can be requested this is the case of general statements.
     * @param   _params  decoded and applied based on the event topic type.
     */
    function registerEvent(bytes calldata _params) external;
    /**
     * @notice  .
     * @dev     onchain contracts can call this to request provided data.
     * @param   _params  decoded and applied based on the event topic type..
     * @return  _data  requested data is encoded and sent as calling contract should know how to decode it.
     */
    function getData(
        bytes calldata _params
    ) external returns (bytes memory _data);
    /**
     * @notice  .
     * @dev     .
     * @param   _params  decoded and applied based on the event topic type.
     * @return  bool  true if data exists otherwise false
     */
    function hasData(bytes calldata _params) external view returns (bool);

    /**
     * @notice  .
     * @dev     validate options from pool. this is neccessary to prevent invalid options
     * @param   _options  options from a pool.
     * @return  bool  true if all options are valid.
     */
    function validateOptions(
        bytes[] calldata _options
    ) external pure returns (bool);

    /**
     * @notice  .
     * @dev     every data provider should have a namespace.
     * @return  string  .
     */
    function namspace() external pure returns (string memory);
}
