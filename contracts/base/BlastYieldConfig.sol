//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IBlast.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// import "@openzeppelin/contracts/access/AccessControl.sol";

contract BlastYieldConfig is Ownable {
  address public yieldContract = 0x4300000000000000000000000000000000000002;
  constructor() {}
  function setYieldContract(address addr_) external onlyOwner {
    yieldContract = addr_;
  }
  function configureAutomaticYield() public onlyOwner{
    IBlast(yieldContract).configureAutomaticYield();
  }
  function configureClaimableYield() public onlyOwner{
    IBlast(yieldContract).configureClaimableYield();
  }
  function readClaimableYield(address contractAddress) external view returns (uint256) {
    return IBlast(yieldContract).readClaimableYield(contractAddress);
  }
  function readYieldConfiguration(address contractAddress) external view returns (uint8) {
    return IBlast(yieldContract).readYieldConfiguration(contractAddress);
  }
}
