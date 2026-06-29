import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("MessageVerifier", function () {
  // Deploy a fresh instance before each test group via loadFixture
  async function deployVerifierFixture() {
    const [admin, student, lecturer, otherAccount] = await ethers.getSigners();
    const MessageVerifier = await ethers.getContractFactory("MessageVerifier");
    const verifier = await MessageVerifier.deploy();
    return { verifier, admin, student, lecturer, otherAccount };
  }

  // ── Deployment ─────────────────────────────────────────────────────────────
  describe("Deployment", function () {
    it("Should set the right admin", async function () {
      const { verifier, admin } = await loadFixture(deployVerifierFixture);
      expect(await verifier.admin()).to.equal(admin.address);
    });

    it("Should assign admin role to deployer", async function () {
      const { verifier, admin } = await loadFixture(deployVerifierFixture);
      expect(await verifier.getUserRole(admin.address)).to.equal("admin");
    });
  });

  // ── Hash Recording and Verification ────────────────────────────────────────
  describe("Hash Recording and Verification", function () {
    it("Should record and verify a message hash", async function () {
      const { verifier, student, lecturer } = await loadFixture(deployVerifierFixture);

      const messageId = "msg-001";
      const messageHash = ethers.id("Hello World! This is a test message.");

      await expect(
        verifier.recordHash(messageId, messageHash, student.address, lecturer.address)
      ).to.emit(verifier, "MessageHashRecorded");

      expect(await verifier.verifyHash(messageId)).to.equal(messageHash);
    });

    it("Should fail if messageId is already recorded", async function () {
      const { verifier, student, lecturer } = await loadFixture(deployVerifierFixture);

      const messageId = "msg-002";
      await verifier.recordHash(messageId, ethers.id("Content 1"), student.address, lecturer.address);

      await expect(
        verifier.recordHash(messageId, ethers.id("Content 2"), student.address, lecturer.address)
      ).to.be.revertedWith("MessageVerifier: messageHash already recorded");
    });

    it("Should fail verifying a non-existent messageId", async function () {
      const { verifier } = await loadFixture(deployVerifierFixture);

      await expect(verifier.verifyHash("nonexistent-msg")).to.be.revertedWith(
        "MessageVerifier: messageId not found"
      );
    });
  });

  // ── User Roles ──────────────────────────────────────────────────────────────
  describe("User Roles", function () {
    it("Should allow admin to assign roles", async function () {
      const { verifier, student, lecturer } = await loadFixture(deployVerifierFixture);

      await expect(verifier.verifyUser(student.address, "student"))
        .to.emit(verifier, "UserVerified")
        .withArgs(student.address, "student");

      await expect(verifier.verifyUser(lecturer.address, "lecturer"))
        .to.emit(verifier, "UserVerified")
        .withArgs(lecturer.address, "lecturer");

      expect(await verifier.getUserRole(student.address)).to.equal("student");
      expect(await verifier.getUserRole(lecturer.address)).to.equal("lecturer");
    });

    it("Should prevent non-admin from verifying users", async function () {
      const { verifier, student, otherAccount } = await loadFixture(deployVerifierFixture);

      await expect(
        verifier.connect(student).verifyUser(otherAccount.address, "lecturer")
      ).to.be.revertedWith("MessageVerifier: Caller is not the admin");
    });
  });
});
