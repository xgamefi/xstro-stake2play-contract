//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./base/XstroVault.sol";

contract XstroStake2Play is XstroVault {
  constructor() {
    configureAutomaticYield();
  }

  function withdrawal() public nonReentrant {
    _withdrawal();
  }
}
