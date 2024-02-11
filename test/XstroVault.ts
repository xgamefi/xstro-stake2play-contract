import { expect } from "chai";
import { ethers } from "hardhat";
import { deployContract, getFee, eth2Wei } from "./helper";
import { XstroVaultTestable } from "../typechain-types/contracts/testable";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

const CONTRACT_NAME = "XstroVaultTestable";
type ContractType = XstroVaultTestable;

describe(CONTRACT_NAME, function () {
  let contract: ContractType;
  let contractAddr: string;
  let contractOwnerCalls: ContractType;
  let contractUser1Calls: ContractType;
  let contractUser2Calls: ContractType;
  let owner: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;
  const notAOwnerErrMsg = "Ownable: caller is not the owner";
  const balance = (addr: string) => ethers.provider.getBalance(addr);
  const deposit = (signer: HardhatEthersSigner, amountInEth: number) =>
    contract.connect(signer).deposit({
      value: eth2Wei(amountInEth)
    });
  const withdrawal = (signer: HardhatEthersSigner) =>
    contract.connect(signer).withdrawal();
  const fakeYield = (amountInEth: number) =>
    owner.sendTransaction({
      to: contractAddr,
      value: eth2Wei(amountInEth)
    });
  beforeEach(async () => {
    const ctx = await deployContract<ContractType>(CONTRACT_NAME);
    contract = ctx.contract;
    contractAddr = ctx.contractAddress;
    owner = ctx.accounts.owner;
    user1 = ctx.accounts.user1;
    user2 = ctx.accounts.user2;
    contractOwnerCalls = contract.connect(owner);
    contractUser1Calls = contract.connect(user1);
    contractUser2Calls = contract.connect(user2);
  });
  describe("setMinWithdrawalInterval", () => {
    const newInterval = 1234;
    describe("when caller is not the owner", async () => {
      it("should revert", async () => {
        await expect(
          contractUser1Calls.setMinWithdrawalInterval(newInterval)
        ).revertedWith(notAOwnerErrMsg);
      });
    });
    describe("when caller is owner", () => {
      it("should set minimum withdrawal interval", async () => {
        await expect(contractOwnerCalls.setMinWithdrawalInterval(newInterval))
          .emit(contract, "SetMinWithdrawalInterval")
          .withArgs(newInterval);
      });
    });
  });
  describe("toggleWithdrawal", () => {
    describe("when caller is not the owner", async () => {
      it("should revert", async () => {
        await expect(contractUser1Calls.setWithdrawalToggle(true)).revertedWith(
          notAOwnerErrMsg
        );
      });
    });
    describe("when caller is owner", () => {
      it("should toggle when it's opened", async () => {
        await contractOwnerCalls.setWithdrawalToggle(true);
        expect(await contract.isWithdrawalAllowed()).eq(true);
        await expect(contractOwnerCalls.setWithdrawalToggle(false)).emit(
          contract,
          "WithdrawalOff"
        );
        expect(await contract.isWithdrawalAllowed()).eq(false);
      });
      it("should toggle when it's closed", async () => {
        expect(await contract.isWithdrawalAllowed()).eq(false);
        await expect(contractOwnerCalls.setWithdrawalToggle(true)).emit(
          contract,
          "WithdrawalOn"
        );
        expect(await contract.isWithdrawalAllowed()).eq(true);
      });
    });
  });
  describe("deposit", () => {
    const depositAmountInEth = 1.234567;
    it("should revert if sending 0 eth", async () => {
      await expect(
        contractUser1Calls.deposit({
          value: 0
        })
      ).revertedWith("value must be > 0");
    });
    it("should append data and emit event if sending non-zero eth", async () => {
      await expect(
        contractUser1Calls.deposit({
          value: eth2Wei(depositAmountInEth)
        })
      )
        .emit(contract, "Deposit")
        .withArgs(
          user1.address,
          eth2Wei(depositAmountInEth),
          eth2Wei(depositAmountInEth)
        );
      expect(await balance(contractAddr)).eq(eth2Wei(depositAmountInEth));
      // Verify staking amount
      expect(await contract.totalStaking()).eq(eth2Wei(depositAmountInEth));
    });
  });
  describe("totalYield", () => {
    const depositAmountInEth = 1.234567;
    it("should able to seperate staking and yield amount", async () => {
      expect(await balance(contractAddr)).eq(0);
      await deposit(user1, depositAmountInEth);
      expect(await contract.totalStaking()).eq(eth2Wei(depositAmountInEth));
      expect(await balance(contractAddr)).eq(eth2Wei(depositAmountInEth));
      // Yield
      const ethYield = 0.99;
      await fakeYield(ethYield);
      expect(await balance(contractAddr)).eq(
        eth2Wei(depositAmountInEth + ethYield)
      );
      expect(await contract.totalStaking()).eq(eth2Wei(depositAmountInEth));
      expect((await contract.totalYield())[1]).eq(eth2Wei(ethYield));
    });
  });
  describe("withdrawal", () => {
    it("should revert if toggle is off", async () => {
      await expect(contractOwnerCalls.withdrawal()).revertedWith(
        "withdrawal is off"
      );
    });
    describe("when wwl toggle is on", () => {
      beforeEach(async () => {
        await contractOwnerCalls.setWithdrawalToggle(true);
      });
      it("should revert if user does not stake", async () => {
        await expect(contractUser1Calls.withdrawal()).revertedWith(
          "must be staking"
        );
      });
      it("should recieve the deposit amount and emit event if user staked", async () => {
        const depositAmountInEth = 1.234567;
        const ethYield = 0.99;
        await deposit(user1, depositAmountInEth);

        const beforeWei = await balance(user1.address);
        // Yield
        await fakeYield(ethYield);
        expect(await balance(contractAddr)).eq(
          eth2Wei(depositAmountInEth + ethYield)
        );
        // Withdrawal
        const tx = await contractUser1Calls.withdrawal();
        await expect(tx)
          .emit(contract, "Withdrawal")
          .withArgs(
            user1.address,
            eth2Wei(depositAmountInEth),
            eth2Wei(ethYield)
          );
        const fee = await getFee(tx);
        const afterEth = await balance(user1.address);
        const wwlEth = afterEth - beforeWei + fee;
        // Verify if getting valid amount
        expect(wwlEth).eq(eth2Wei(depositAmountInEth));
        // Verify total stake amount
        expect(await contract.totalStaking()).eq(0);
        // Verify contract balance
        expect(await balance(contractAddr)).eq(eth2Wei(ethYield));
      });
    });
  });
  describe("userStake", () => {
    const depositAmountInEth = 1.234567;
    beforeEach(async () => {
      await contractOwnerCalls.setWithdrawalToggle(true);
    });
    it("should have data if user deposited", async () => {
      await deposit(user1, depositAmountInEth);
      const latestTimestamp = await time.latest();
      const [depositAmount, depositTimestamp] = await contract.userStake(
        user1.address
      );
      expect(depositAmount).eq(eth2Wei(depositAmountInEth));
      expect(depositTimestamp).eq(latestTimestamp);
    });
    it("should remove data if user withdrawal", async () => {
      await deposit(user1, depositAmountInEth);
      await withdrawal(user1);
      const [depositAmount, depositTimestamp] = await contract.userStake(
        user1.address
      );
      expect(depositAmount).eq(0);
      expect(depositTimestamp).eq(0);
    });
  });
  describe("withdrawalYield", () => {
    const depositAmountInEth = 1.234567;
    const ethYield = 0.99;
    it("should revert if not owner", async () => {
      await expect(contractUser1Calls.withdrawalYield()).revertedWith(
        notAOwnerErrMsg
      );
    });
    it("should revert if no yield", async () => {
      await deposit(user1, depositAmountInEth);
      await expect(contractOwnerCalls.withdrawalYield()).revertedWith(
        "yield must be > 0"
      );
    });
    it("should withdrawal yield if it has balance", async () => {
      await deposit(user1, depositAmountInEth);
      await fakeYield(ethYield);
      const balanceBefore = await balance(owner.address);
      const tx = await contractOwnerCalls.withdrawalYield();
      const fee = await getFee(tx);
      const balanceAfter = await balance(owner.address);
      const balanceDiff = balanceAfter - balanceBefore;
      expect(balanceDiff).eq(eth2Wei(ethYield) - fee);
    });
  });
});
