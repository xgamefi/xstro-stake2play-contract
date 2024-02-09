import hre, { ethers } from "hardhat";
// import { toWei } from "web3-utils"

async function main() {
  console.log("Selected network: ", hre.network.name);
  const contractName = "XstroStake2Play";
  // const [owner] = await ethers.getSigners();
  // const contract = await ethers.deployContract(contractName);
  const contract = await ethers.deployContract(contractName, [], {});
  await contract.waitForDeployment();
  console.log(contract);

  // const contract = await ethers.deployContract(contractName, [5]);
  // console.log(await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
