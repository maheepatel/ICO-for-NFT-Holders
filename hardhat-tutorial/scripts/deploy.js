const { ethers } = require("hardhat");
require("dotenv").config({path:".env"});
const { CRYPTO_DEVS_NFT_CONTRACT_ADDRESS } = require("../constants");

async function main () {
  //Crypto Devs NFT contract address that we deployed in previous module
  const crytpoDevsNFTContract = CRYPTO_DEVS_NFT_CONTRACT_ADDRESS;
  
  /**
   * A contractFactory in ethers.js is an abstraction used to deploy new Smart contracts, 
   * so cryptoDevsTokenContract here is a factory for instances of our CryptoDevToken contract.
   */

  const cryptoDevsTokenContract = await ethers.getContractFactory(
    "CryptoDevToken"
  );

  //deploy the contract
  const deployedCryptoDevsTokenContract = await cryptoDevsTokenContract.deploy(
    crytpoDevsNFTContract
  );

  await deployedCryptoDevsTokenContract.deployed();
  // print the address of the deployed contract
  console.log(
     "Crypto Devs token Contract Address:",
     deployedCryptoDevsTokenContract.address
    );


}

//call the main function and catch if there is any error
main()
.then(()=> process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
});



















