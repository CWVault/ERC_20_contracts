// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./Groups.sol";


contract XVTToken is ERC20, AccessControl, Pausable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant ATTORNEY_ROLE = keccak256("ATTORNEY_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant OWNER_ROLE = keccak256("OWNER_ROLE");


    uint8 public constant WHITELIST = 1;
    uint8 public constant FROZEN = 2;


    using Groups for Groups.GroupMap;

    Groups.GroupMap groups;

    event AddedToGroup(uint8 indexed groupId, address indexed account);
    event RemovedFromGroup(uint8 indexed groupId, address indexed account);
    event MultiTransferPrevented(address indexed from, address indexed to, uint256 value);


    modifier isNotFrozen() {
        require(!isFrozen(msg.sender), "Freezed account");
        _;
    }

    constructor(uint256 initialSupply) ERC20("XVT", "XVT") {
        // Grant the contract deployer the default admin role: it will be able
        // to grant and revoke any roles
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(OWNER_ROLE, msg.sender);
        _setupRole(ADMIN_ROLE, msg.sender);
        _setupRole(OPERATOR_ROLE, msg.sender);
        _setupRole(ATTORNEY_ROLE, msg.sender);

        _mint(msg.sender, initialSupply);
    }

    // Burn the token

    function burn(address from, uint256 amount) public whenNotPaused isNotFrozen onlyRole(ADMIN_ROLE) {
        _burn(from, amount);
    }

    // check the transactor's role before transaction

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused isNotFrozen{ 
        require(
            hasRole(OWNER_ROLE, msg.sender) ||
            hasRole(ADMIN_ROLE, msg.sender) ||
            hasRole(OPERATOR_ROLE, msg.sender),
            "Access restricted to particular accounts"
        );
        super._beforeTokenTransfer(from, to, amount);
    }

    // check the role for allowance and approve

    function increaseAllowance(
        address spender,
        uint256 addedValue
    ) public override onlyRole(ADMIN_ROLE) returns(bool){
        bool allow = super.increaseAllowance(spender, addedValue);
        return allow;
    }

    function decreaseAllowance(
        address spender,
        uint256 subtractedValue
    ) public override onlyRole(ADMIN_ROLE) returns(bool){
        bool allow = super.decreaseAllowance(spender, subtractedValue);
        return allow;
    }

    function approve (
        address spender,
        uint256 amount
    )public override onlyRole(ADMIN_ROLE) returns(bool){
        bool approved = super.approve(spender, amount);
        return approved;
    }
    //Pause and unPause

    function pause() public onlyRole(ATTORNEY_ROLE){
        _pause();
    }

    function unPause() public onlyRole(ATTORNEY_ROLE){
        _unpause();
    }

    // WHITELIST

    function addToWhitelist(address account) 
    public 
    whenNotPaused 
    isNotFrozen 
    onlyRole(ADMIN_ROLE) 
    {
        _add(WHITELIST, account);
    }

    function removeFromWhitelist(address account)
    public 
    whenNotPaused 
    isNotFrozen 
    onlyRole(ADMIN_ROLE) 
    {
        _remove(WHITELIST, account);
    }

//check the role from client
    function isWhitelisted(address account) public view returns (bool) {
        return _contains(WHITELIST, account);
    }

    // FROZEN

    function freeze(address account) 
    public 
    whenNotPaused 
    isNotFrozen 
    onlyRole(ADMIN_ROLE) 
    {
        _add(FROZEN, account);
    }

    function unfreeze(address account) 
    public 
    whenNotPaused 
    isNotFrozen 
    onlyRole(ADMIN_ROLE) 
    {
         _remove(FROZEN, account);
    }

// check role from client

    function isFrozen(address account) public view returns (bool) {
        return _contains(FROZEN, account);
    }

    // account handling methods

    function  _add(uint8 groupId, address account) internal {
        groups.add(groupId, account);
        emit AddedToGroup(groupId, account);
    }

    function _remove(uint8 groupId, address account) internal {
        groups.remove(groupId, account);
        emit RemovedFromGroup(groupId, account);
    }

    function _contains(uint8 groupId, address account) internal view returns (bool) {
        return groups.contains(groupId, account);
    }

    //multitransaction
    function multiTransfer(address[] calldata to, uint256[] calldata amount)
        public whenNotPaused isNotFrozen
        returns (bool)
    {
         require(
            hasRole(OWNER_ROLE, msg.sender) ||
            hasRole(ADMIN_ROLE, msg.sender) ||
            hasRole(OPERATOR_ROLE, msg.sender),
            "Access restricted to particular accounts"
        );
        require(
            to.length >0 &&
            to.length == amount.length,
            "Empty array or array length mismatch"
            );


        for (uint256 i = 0; i < to.length; i++) {
            if (!isFrozen(to[i])) {
                _transfer(msg.sender, to[i], amount[i]);
            } else {
                emit MultiTransferPrevented(msg.sender, to[i], amount[i]);
            }
        }

        return true;
    }

    function addAdmin (address newAdmin) public isNotFrozen onlyRole(ADMIN_ROLE){
        super.grantRole(ADMIN_ROLE, newAdmin);
    }

    function revokeAdmin(address newAdmin) public isNotFrozen onlyRole(ADMIN_ROLE){
        super.revokeRole(ADMIN_ROLE, newAdmin);
    }

    function addOperator(address newOperator) public isNotFrozen onlyRole(ADMIN_ROLE){
        super.grantRole(OPERATOR_ROLE, newOperator);
    }

    function revokeOperator( address newOperator) public isNotFrozen onlyRole(ADMIN_ROLE){
        super.revokeRole(OPERATOR_ROLE, newOperator);
    }

    function addAttorney(address newAccount) public isNotFrozen onlyRole(ADMIN_ROLE){
        super.grantRole(ATTORNEY_ROLE, newAccount);
    }

    function revokeAttorney( address newAccount) public isNotFrozen onlyRole(ADMIN_ROLE){
        super.revokeRole(ATTORNEY_ROLE, newAccount);
    }
}