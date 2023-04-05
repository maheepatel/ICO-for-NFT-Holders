import { BigNumber, Bignumber, Contract, providers, utils } from "ethers";
import Head from "next/head";
import React, { useState, useEffect, useRef } from "react";
import Web3Modal, { getProviderDescription } from "web3modal";
import {
    NFT_CONTRACT_ABI,
    NFT_CONTRACT_ADDRESS,
    TOKEN_CONTRACT_ABI,
    TOKEN_CONTRACT_ADDRESS,
} from "../constants";
import styles from "../styles/Home.module.css";
// import { error } from "console";

export default function Home() {
    // create a BigNumber `0`
    const zero = BigNumber.from(0);
    //walletConnected  tracks user's wallet connection
    const [walletConnected, setWalletConnected] = useState(false);
    // loading = true when waiting for txn to mined
    const [loading, setLoading] = useState(false);
    //tokensToBeClaimed teacks no of tokens to be claimed
    //based on Crypto Dev NFT's held by user
    const [tokensToBeClaimed, setTokensToBeClaimed] = useState(zero);
    //balanceOfCryptoDevTokens keeps track of tokens owned by address
    const [balanceOfCryptoDevTokens, setBalanceOfCryptoDevTokens] = useState(zero);
    //amount of tokens user want to mint
    const [tokenAmount, setTokenAmount] = useState(zero);
    // tokensMinted is total no of tokens thats minted till now out of 10000(max supply)
    const [tokensMinted, setTokensMinted] = useState(zero);
    // isOwner gets owner of the contract through the signed address
    const [isOwner, setIsOwner] = useState(false);
    // Create a reference to Web3 Modal  which persists as long as the page is open
    const web3ModalRef = useRef();


    /**
     * getTokensToBeClaimed: checks the bal of tokens that can be claimed by user
     */

    const getTokensToBeClaimed = async () => {
        try {
            //get provider from web3Modal,(metamask)
            //signer not needed, as we are inly reading state from blockchain
            const provider = await getProviderOrSigner();
            //Create instance of NFT contract
            const nftContract = new Contract(
                NFT_CONTRACT_ADDRESS,
                NFT_CONTRACT_ABI,
                provider
            );
            //create an instance of tokenContract
            const tokenContract = new Contract(
                TOKEN_CONTRACT_ADDRESS,
                TOKEN_CONTRACT_ABI,
                provider
            );
            // get signer now to extract the address of the currently connected metamask act
            const signer = await getProviderOrSigner(true);
            // Get address associated to signer connected to metamask
            const address = await signer.getAddress();
            // call the balamceOf from the NFT contrat to get no of NFT's held by user
            const balance = await nftContract.balanceOf(address);
            // balance is a Big Number and thus we would compare it with BigNumber `zero`
            if (balance === zero) {
                setTokensToBeClaimed(zero);
            } else {
                //amount to track no of unclaimed tokens
                var amount = 0;
                // for all the NFT's, check if tokens have already been claimed
                // Only increase amount if tokens have not been claimed
                // for a NFT(for given tokenId)
                for (var i = 0; i < balance; i++) {
                    const tokenId = await nftContract.tokenOfOwnerByIndex(address, i);
                    const claimed = await tokenContract.tokenIdsClaimed(tokenId);
                    if (!claimed) {
                        amount++;
                    }
                }
                //tokensToBeClaimed has be en initialized to a big number, thus we would convert amount 
                // to bug number and then set its value
                setTokensToBeClaimed(BigNumber.from(amount));
            }
        } catch (err) {
            console.error(err);
            setTokensToBeClaimed(zero);
        }
    };

    /**
     * get BalanceOfCryptoDevTokens: checks the balance of crypto Dev token's held by an address
     */

    const getBalanceOfCryptoDevTOkens = async () => {
        try {
            //provider from web3modal(metamask), signer not needed
            const provider = await getProviderOrSigner();
            //create an instance of token contract
            const tokenContract = new Contract(
                TOKEN_CONTRACT_ADDRESS,
                TOKEN_CONTRACT_ABI,
                provider
            );
            //signer to get address of connected metamask account
            const signer = await getProviderOrSigner(true);
            // get address
            const address = await signer.getAddress();
            // call balanceOf from token contract for tokens held by user
            const balance = await tokenContract.balanceOf(address);
            //balance if already a big number
            setBalanceOfCryptoDevTokens(balance);
        } catch (err) {
            console.error(err);
            setBalanceOfCryptoDevTokens(zero);
        }
    }

    /**
     * minstCryptoDevToken: mints `amount` number of tokens to a given number
     */

    const mintCryptoDevToken = async (amount) => {
        try {
            // signer to write a txn
            const signer = await getProviderOrSigner(true);
            // instance of tokenContract
            const tokenContract = new Contract(
                TOKEN_CONTRACT_ADDRESS,
                TOKEN_CONTRACT_ABI,
                signer
            );
            // Each token = `0.0.1 ether`.We need to send `0.001*amount`
            const value = 0.001 * amount;
            const tx = await tokenContract.mint(amount, {
                //value = cost of one Crypto dev token which is 0.001 eth.
                // we'll parse `0.001` string to ether using utils lin from ether.js
                value: utils.parseEther(value.toString()),
            });
            setLoading(true);
            //wait for the txn to mint
            await tx.wait();
            setLoading(false);
            window.alert("Successfully minted Crypto Dev Tokens");
            await getBalanceOfCryptoDevTOkens();
            await getTotalTokensMinted();
            await getTokensToBeClaimed();
        } catch (err) {
            console.error(err);
        }
    };

    /**
     * claimCryptoDevTokens: Helps the user claim crypto dev token
     */

    const claimCryptoDevTokens = async () => {
        try {
            //Signer
            const signer = await getProviderOrSigner(true);
            //instance os tokenContract
            const tokenContract = new Contract(
                TOKEN_CONTRACT_ADDRESS,
                TOKEN_CONTRACT_ABI,
                signer
            );
            const tx = await tokenContract.claim();
            setLoading(true);
            // wait for txn to get minted
            await tx.wait();
            setLoading(false);
            window.alert("Successfully claimed Crypto Dev Tokens");
            await getBalanceOfCryptoDevTOkens();
            await getTotalTokensMinted();
            await getTokensToBeClaimed();
        } catch (err) {
            console.error(err);
        }
    };

    /**
     * getTotalTokensMinted(): Retrives how many tokens gave been minted till now
     * out of total supply
     */

    const getTotalTokensMinted = async () => {
        try {
            //Provider 
            const provider = await getProviderOrSigner();
            // instance of token contract
            const tokenContract = new Contract(
                TOKEN_CONTRACT_ADDRESS,
                TOKEN_CONTRACT_ABI,
                provider
            );
            // Get all tokens that are minted
            const _tokensMinted = await tokenContract.totalSupply();
            setTokensMinted(_tokensMinted);
        } catch (err) {
            console.error(err);
        }
     };

     /**
      * getOwner: gets contract owner by connected address
      */
     const getOwner = async() => {
        try{
            const provider = await getProviderOrSigner();
            const tokenContract = new Contract(
                TOKEN_CONTRACT_ADDRESS,
                TOKEN_CONTRACT_ABI,
                provider
            );
            //call owner fun from contract
            const _owner = await tokenContract.owner();
            //signer to extract address of connected user
            const signer = await getProviderOrSigner(true);
            //Get address
            const address = await signer.getAddress();
            if(address.toLowerCase() === _owner.toLowerCase()) {
                setIsOwner(true)
;            }
        } catch(err) {
            console.error(err.message);
        }
     };

     /**
      * withdrawCoins: withdraws ether by calling the withdraw fun in contract
      */
     const withdrawCoins = async () => {
        try{
            const signer = await getProviderOrSigner(true);
            const tokenContract = new Contract(
                TOKEN_CONTRACT_ADDRESS,
                TOKEN_CONTRACT_ABI,
                signer
            );

            const tx = await tokenContract.withdraw();
            setLoading(true);
            await tx.wait();
            setLoading(false);
            await getOwner();
        } catch (err) {
            console.error(err);
            window.alert(err.reason);
        }
     };

     /**
      * Returns a provider or signer object representing the eth RPC with or without 
      * signing capabilities of metamask
      * 
      * A `provider` - to interact with the blockchain 
      * 
      * A `signer` - to write txn, connected act to make a digital signature to authorize the txn.
      * @param {*} needSigner = true if you need the signer, default false otherwise
      */

     const getProviderOrSigner = async (needSigner = false) => {
        //connect to metamask
        // Since we store `web3Modal` as a reference, we need to access the `current` value to get access to the underlying object
        const provider = await web3ModalRef.current.connect();
        const web3Provider = new providers.Web3Provider(provider);

        //If user is not connected to Goerli network. let the know
        const {chainId} = await web3Provider.getNetwork();
        if (chainId !==5) {
            window.alert("Changer the network to Goerli");
            throw new error("Change network to goeri")
        }

        if(needSigner) {
            const signer = web3Provider.getSigner();
            return signer;
        }
        return web3Provider;
     };

     /**
      * ConnectWallet: connects the metamask wallet
      */
     const connectWallet = async () => {
        try{
            // Provider
            await getProviderOrSigner();
            setWalletConnected(true);
        }catch(err){
            console.error(err);
        }
     };

    //useEffects are used to react to changes in state of website
    // The array at end of fun call represents what state changes will trigger this effect
    // Here whenever the value of `walletConnected` changes this effect is called
    useEffect( () => {
        // wallet not connected, create a new instance of web3Modal and connect 
        if(!walletConnected) {
            // Assign the Web3Modal class to the reference object by setting its current value
            // The `current` value is persisted throughout as long as this page is open
            web3ModalRef.current = new Web3Modal({
                network: "goerli",
                providerOptions: {},
                disableInjectedProvider: false,
            });
            connectWallet();
            getTotalTokensMinted();
            getBalanceOfCryptoDevTOkens();
            getTokensToBeClaimed();
            getOwner();
        }
    }, [walletConnected]);
    
    /**
     * renderButton: returns a button on the state of the dapp
     */
    const renderButton = () => {
        // If we are currently waiting for something, return a loading button
        if(loading) {
            return(
                <div>
                    <button className={styles.button}>Loading...</button>
                </div>
            );
        }
        //If tokens to be claimed are greater than 0, return aclaim button
        if(tokensToBeClaimed > 0) {
            return(
                <div>
                    <div className={styles.description}>
                    {tokensToBeClaimed*10} Tokens can be claimed!
                    </div>
                    <button className={styles.button} onClick={claimCryptoDevTokens}>
                    Claim Tokens
                    </button>
                </div>
            );
        }
        //if user doesn't have any tokens to claim, show the mint button
        return(
            <div style={{ display: "flax=col"}}>
                <div>
                    <input
                    type="number"
                    placeholder="Amount of tokens"
                    //BigNumber.from converts the `e.target.value` to a BigNumber
                    onChange={(e) => setTokenAmount(BigNumber.from(e.target.value))}
                    className={styles.input}
                    />  
                </div>

                <button
                className={styles.button}
                disabled={!(tokenAmount>0)}
                onClick={() => mintCryptoDevToken(tokenAmount)}
                >
                    Mint Tokens
                </button>
            </div>
        );
    };

    return (
        <div>
            <Head>
                <title>Crypto Devs</title>
                <meta name="description" content="ICO-Dapp" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <div className={styles.main}>
                <div>
                    <h1 className={styles.title}>Welcome to Crypto Devs ICO!</h1>
                    <div className={styles.description}>
                        You can claim or mint CryptoDev tokens here
                    </div>
                    {walletConnected ? (
                        <div>
                            <div className={styles.description}>
                            {/* Format Ether helps us in converting a BigNumber to String  */}
                            You have minted {utils.formatEther(balanceOfCryptoDevTokens)} Crypto Dev Tokns
                            </div>
                            <div className={styles.description}>
                            {/* {utils.formatEther(tokensMinted)}/10000 means out of 10,000 how many tokens have been minted */}
                            Overall {utils.formatEther(tokensMinted)}/10000 have been minted!!!
                            </div>
                            {renderButton()}
                            {/* Display additional withdraw button if connected wallet is owner */}
                            {isOwner ? (
                                <div>
                                    {loading ? <button className={styles.button}>Loading...</button>
                                             : <button className={styles.button} onClick={withdrawCoins}>
                                                Withdraw Coins
                                             </button>                               
                                    }
                                </div>
                            ) : ("")
                            }
                        </div>
                    ) : (
                        <button onClick={connectWallet} className={styles.button}>
                            Connect your wallet
                        </button>
                    )}
                </div>
                <div>
                    <img className={styles.image} src="./0.svg" />
                </div>
            </div>
            <footer className={styles.footer}>
                Made with &#10084; by Crypto Devs 
            </footer>
        </div>
    );
}














