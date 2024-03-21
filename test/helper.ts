import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { ContractTransactionReceipt, ContractTransactionResponse, Signer } from "ethers";

export interface IHardhatTestCtx<T> {
  contract: T;
  contractAddress: string;
  accounts: Record<string, HardhatEthersSigner>;
}
export interface IGetSignMessage {
  digest: string;
  signature: string;
}

export async function deployContract<T>(
  name: string,
  args?: (string | number)[]
): Promise<IHardhatTestCtx<T>> {
  const contract: any = await ethers.deployContract(name, args ? args : [], {});
  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();
  const [owner, user1, user2] = await ethers.getSigners();
  return {
    contract,
    contractAddress,
    accounts: {
      owner,
      user1,
      user2
    }
  };
}
export const getFee = async (tx: ContractTransactionResponse): Promise<bigint> => {
  const receipt = (await tx.wait()) as ContractTransactionReceipt;
  return receipt.gasUsed * receipt.gasPrice;
};
export const eth2Wei = (eth: number) => ethers.parseEther(eth.toString());

export const packedKeccak256 = (addr: string, amountInEth: number, nonce: number) =>
  ethers.solidityPackedKeccak256(
    ["address", "uint256", "uint256"],
    [addr, eth2Wei(amountInEth), nonce]
  );

export const getSignMsg = async (signer: Signer, hash: string): Promise<IGetSignMessage> => ({
  digest: ethers.hashMessage(ethers.toBeArray(hash)),
  signature: await signer.signMessage(ethers.toBeArray(hash))
});

export const balance = (addr: string) => ethers.provider.getBalance(addr);
