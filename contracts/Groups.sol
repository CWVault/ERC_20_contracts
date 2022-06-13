// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.6.10;

/**
 * @dev Unified system for arbitrary user groups.
 *
 */
library Groups {
    struct MemberMap {
        mapping(address => bool) members;
    }

    struct GroupMap {
        mapping(uint8 => MemberMap) groups;
    }

    /**
     * @dev Add an account to a group
     *
     */
    function add(
        GroupMap storage map,
        uint8 groupId,
        address account
    ) internal {
        MemberMap storage group = map.groups[groupId];
        require(account != address(0));
        require(!groupContains(group, account));

        group.members[account] = true;
    }

    /**
     * @dev Remove an account from a group
     *
     */
    function remove(
        GroupMap storage map,
        uint8 groupId,
        address account
    ) internal {
        MemberMap storage group = map.groups[groupId];
        require(account != address(0));
        require(groupContains(group, account));

        group.members[account] = false;
    }

    /**
     * @dev Returns true if the account is in the group
     *
     * @return bool
     */
    function contains(
        GroupMap storage map,
        uint8 groupId,
        address account
    ) internal view returns (bool) {
        MemberMap storage group = map.groups[groupId];
        return groupContains(group, account);
    }

    function groupContains(MemberMap storage group, address account) internal view returns (bool) {
        require(account != address(0));
        return group.members[account];
    }
}
