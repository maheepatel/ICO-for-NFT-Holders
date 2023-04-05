// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

  import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
  import "@openzeppelin/contracts/access/Ownable.sol";
  import "./ICryptoDevs.sol";

contract CryptoDevToken is ERC20, Ownable {
   uint256 public constant tokenPrice = 0.001 ether; //Price os one CryptoDev token
  //1 NFT = 10tokens
  //Make it 10*(10**18)  as ERC20 tokens are represented by the smallest denomination possible for the token
  //By default, ERC20 tokens have the smallest denomination of 10^(-18)).This means, having a balance of (1) = (10^ -18) tokens.
  //Owning 1 token = owning (10^18) tokens when you account for the decimal places.

  uint256 public constant tokensPerNFT = 10*10**18;
  //Max supply is 10,000
  uint256 public constant maxTotalSupply = 10000*10**18;
  //CryptoDevsNFT contract instance
  ICryptoDevs CryptoDevsNFT;
  //keeping track of which tokenIds have been claimed
  mapping (uint256 => bool) public tokenIdsClaimed;
  
  constructor(address _cryptoDevsContract) ERC20("Crypto Dev Token", "TCD") {
    CryptoDevsNFT = ICryptoDevs(_cryptoDevsContract);
  }

/**
 * @dev Mints `amount` no. of CryptoDevTOkens
 * Requirements: `msg.value` = tokenPrice*amount
 */
function mint(uint256 amount) public payable {
  // ether >= tokenPrice*amount
  uint256 _requiredAmount = tokenPrice*amount;
  require(msg.value >= _requiredAmount, "Ether sent is incorrect");
  //total tokens +amount <= 10000, else revert txn
  uint256 amountWithDecimals = amount*10**18;
  require(
    (totalSupply() + amountWithDecimals) <= maxTotalSupply,
    "Exceeds the max total supply."
  );
  //call the internal function ERC20 Contract
  _mint(msg.sender, amountWithDecimals);

}

/**
 * @dev Mints tokens  = no of NFTs held by sender
 * Req: bal of Crypto Dev NFTs owned by sender > 0
 * Tokens shld jave not been claimed for all NFTs owned by sender
 */
function claim() public {
  address sender = msg.sender;
  // No of NFTs held by sender address
  uint256 balance = CryptoDevsNFT.balanceOf(sender);
  // if bal=0 revert txn
  require(balance>0, "You don't have any Crypto Dev NFT");
  // amount keeps track of no of unclaimed tokenIds
  uint256 amount =0;
  //loop ove balance and get the token ID owned by `sender` at a given index of its token list
  for(uint256 i=0; i< balance; i++){
    uint256 tokenId = CryptoDevsNFT.tokenOfOwnerByIndex(sender, i);
    // if tokenId not claimed, increase the amt
    if(!tokenIdsClaimed[tokenId]){
      amount+=1;
      tokenIdsClaimed[tokenId] = true;
    }
  }
  //If all tokenIds claimed , revert txn
  require(amount>0, "You have already claimed all tokens");
  //call the interna fun from ERC20 contract
  // Mint (amount*10) tokens for each NFT
  _mint(msg.sender, amount*tokensPerNFT);
}

/**
 * @dev withdraws all ETH sent to this contract
 * Req: wallet connected must be owners address
 */

function withdraw() public onlyOwner{
  uint256 amount = address(this).balance;
  require(amount > 0, "Nothing to withdraw, contract balance empty");

  address _owner = owner();
  (bool sent, ) = _owner.call{value: amount}("");
  require(sent, "Failed to send Ether");
}

// function to receive Ether. msg.data must be empty
receive() external payable{}

//Fallback funtion is called when msg.data is not empty
fallback() external payable{}


}


  