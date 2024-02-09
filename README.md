# deploy
yarn deploy --network $NETWORK
ex: `yarn deploy --network BLAST_TESTNET`
# verify 
`yarn verify --network $NETWORK --contract $CONTRACT $DEPLOYED_CONTRACT_ADDRESS``
ex: `yarn verify --network BLAST_TESTNET --contract contracts/XstroStake2Play.sol:XstroStake2Play 0xEDE45139b4C003C3767FAEc2B7c928Fe294F07f8`
