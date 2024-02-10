import hre, { ethers } from "hardhat";

async function main() {
  console.log("Selected network: ", hre.network.name);
  const contractName = "XstroStake2Play";
  const contract = await ethers.deployContract(contractName);
  await contract.waitForDeployment();
  console.log("Address: ", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
