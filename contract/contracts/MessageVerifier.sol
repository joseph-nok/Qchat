// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MessageVerifier
 * @dev A simple smart contract to record message hashes and manage user roles.
 */
contract MessageVerifier {
    address public admin;

    struct MessageRecord {
        bytes32 messageHash;
        address sender;
        address receiver;
        uint256 timestamp;
    }

    // Mapping from messageId to MessageRecord
    mapping(string => MessageRecord) private messageRecords;

    // Mapping from user address to their role ("student", "lecturer", "admin")
    mapping(address => string) private userRoles;

    // Events for frontend listening
    event MessageHashRecorded(
        string messageId,
        bytes32 messageHash,
        address indexed sender,
        address indexed receiver,
        uint256 timestamp
    );

    event UserVerified(
        address indexed userAddress,
        string role
    );

    // Modifier to restrict access to the admin only
    modifier onlyAdmin() {
        require(msg.sender == admin, "MessageVerifier: Caller is not the admin");
        _;
    }

    /**
     * @dev Sets the deployer as the admin.
     */
    constructor() {
        admin = msg.sender;
        userRoles[admin] = "admin";
        emit UserVerified(admin, "admin");
    }

    /**
     * @dev Records immutable hash for every chat or Q&A message.
     * @param messageId Unique identifier for the message (from DB).
     * @param messageHash Keccak256 hash of the message content.
     * @param sender Address of the user sending the message.
     * @param receiver Address of the user receiving the message.
     */
    function recordHash(
        string memory messageId,
        bytes32 messageHash,
        address sender,
        address receiver
    ) external {
        require(bytes(messageId).length > 0, "MessageVerifier: messageId cannot be empty");
        require(messageRecords[messageId].timestamp == 0, "MessageVerifier: messageHash already recorded");

        messageRecords[messageId] = MessageRecord({
            messageHash: messageHash,
            sender: sender,
            receiver: receiver,
            timestamp: block.timestamp
        });

        emit MessageHashRecorded(messageId, messageHash, sender, receiver, block.timestamp);
    }

    /**
     * @dev Returns stored hash for a specific messageId.
     * @param messageId The ID of the message to verify.
     * @return The bytes32 hash of the message.
     */
    function verifyHash(string memory messageId) external view returns (bytes32) {
        require(messageRecords[messageId].timestamp != 0, "MessageVerifier: messageId not found");
        return messageRecords[messageId].messageHash;
    }

    /**
     * @dev Admin verifies users and assigns roles.
     * @param userAddress Address of the user to verify.
     * @param role Role to assign ("student", "lecturer", "admin").
     */
    function verifyUser(address userAddress, string memory role) external onlyAdmin {
        require(userAddress != address(0), "MessageVerifier: Invalid address");
        require(bytes(role).length > 0, "MessageVerifier: Role cannot be empty");

        userRoles[userAddress] = role;
        emit UserVerified(userAddress, role);
    }

    /**
     * @dev Returns the role of a given user.
     * @param userAddress Address of the user to query.
     * @return string Role of the user.
     */
    function getUserRole(address userAddress) external view returns (string memory) {
        return userRoles[userAddress];
    }
}
