//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "../base/XstroVault.sol";

contract XstroVaultTestable is XstroVault {
  function withdrawal() public nonReentrant {
    _withdrawal();
  }

  function deposit() public payable nonReentrant {
    _deposit();
  }
}
