import './App.css';
import { Button, ButtonToolbar,ButtonGroup} from 'react-bootstrap';  
import 'bootstrap/dist/css/bootstrap.min.css';
import Web3 from 'web3';
import axios from 'axios';
import React, { Component } from 'react';
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";
import WalletLink from "walletlink";
import "sf-font";
import ABI from './ABI.json';
import VAULTABI from './VAULTABI.json';
import TOKENABI from './TOKENABI.json';
import { NFTCONTRACT, STAKINGCONTRACT, polygonscanapi, moralisapi, nftpng } from './config';

var account = null;
var contract = null;
var vaultcontract = null;
var web3 = null;


const polygonscanapikey = "N6T3SSDAWWEBDHP2VR2424B3Z51UFGRVVI";
const moralisapikey = "rjbVuX2UJ7f16EyEVSkXuOrObKN5zqQumKQP6wYh27aPsQyK0GGeBpgM9XB36KiX";

const providerOptions = {
	binancechainwallet: {
		package: true
	  },
	  walletconnect: {
		package: WalletConnectProvider,
		options: {
		  infuraId: "190b2c17c88b44d08fb0ec79785d1718"
		}
	},
	walletlink: {
		package: WalletLink, 
		options: {
		  appName: "MPN PROJECT", 
		  infuraId: "190b2c17c88b44d08fb0ec79785d1718",
		  rpc: "", 
		  chainId: 4, 
		  appLogoUrl: null, 
		  darkMode: true 
		}
	  },
};

const web3Modal = new Web3Modal({
	network: "rinkeby",
	theme: "dark",
	cacheProvider: true,
	providerOptions 
  });


class App extends Component {
	constructor() {
		super();
		this.state = {
			balance: [],
			nftdata: [],
		};
	}

	handleModal(){  
		this.setState({show:!this.state.show})  
	} 

	handleNFT(nftamount) {
		this.setState({outvalue:nftamount.target.value});
  	}

	async componentDidMount() {
		
		await axios.get((polygonscanapi + `?module=stats&action=tokensupply&contractaddress=${NFTCONTRACT}&apikey=${polygonscanapikey}`))
		.then(outputa => {
            this.setState({
                balance:outputa.data
            })
            console.log(outputa.data)
        })
		let config = {'X-API-Key': moralisapikey, 'accept': 'application/json'};
		await axios.get((moralisapi + `/nft/${NFTCONTRACT}/owners?chain=mumbai&format=decimal`), {headers: config})
		.then(outputb => {
			const { result } = outputb.data
            this.setState({
                nftdata:result
            })
            console.log(outputb.data)
        })
	}
  
  render() {
	const {balance} = this.state;
	const {nftdata} = this.state;
	const {outvalue} = this.state;

	async function connectwallet() { 
		var provider = await web3Modal.connect();
		
		web3 = new Web3(provider); 
		await provider.send('eth_requestAccounts'); 
		var accounts = await web3.eth.getAccounts(); 
		account = accounts[0]; 
		document.getElementById('wallet-address').textContent = account; 
		contract = new web3.eth.Contract(ABI, NFTCONTRACT);
		vaultcontract = new web3.eth.Contract(VAULTABI, STAKINGCONTRACT, TOKENABI);
  }

  
		async function mint() {
			var _mintAmount = Number(outvalue);
			var mintRate = Number(await contract.methods.cost().call()); 
			var totalAmount = mintRate * _mintAmount; 
		  contract.methods.mint(account, _mintAmount).send({ from: account, value: String(totalAmount) }); 
		} 

   async function claimit() {
   var rawnfts = await vaultcontract.methods.tokensOfOwner(account).call();
   const arraynft = Array.from(rawnfts.map(Number));
   const tokenid = arraynft.filter(Number);
   tokenid.forEach(async (id) => {
   await vaultcontract.methods.claim([id]).send({from: account, })
   }) }

  async function stakeit() {
	var tokenids = Number(document.querySelector("[name=stkid]").value);
	vaultcontract.methods.stake([tokenids]).send({from: account});
	  }
	  
	  async function unstakeit() {
	var tokenids = Number(document.querySelector("[name=stkid1]").value);
	vaultcontract.methods.unstake([tokenids]).send({from: account});
	  }
  
  async function verify() {
	  var getbalance = Number(await vaultcontract.methods.balanceOf(account).call());
	  document.getElementById('stakedbalance').textContent = getbalance; 
  }
  
  async function enable() {
	  contract.methods.setApprovalForAll(STAKINGCONTRACT, true).send({from: account});
	}

	async function rewardinfo() {
		
		var rawnfts = await vaultcontract.methods.tokensOfOwner(account).call();
		const arraynft = Array.from(rawnfts.map(Number));
		const tokenid = arraynft.filter(Number);
		var rwdArray = [];
		tokenid.forEach(async (id) => {
		  var rawearn = await vaultcontract.methods.earningInfo(account, [id]).call();
		  var array = Array.from(rawearn.map(Number));
		  array.forEach(async (item) => {
			var earned = String(item).split(",")[0];
			var earnedrwd = Web3.utils.fromWei(earned);
			var rewardx = Number(earnedrwd).toFixed(2);
			var numrwd = Number(rewardx);
			rwdArray.push(numrwd)
		  });
		});
		function delay() {
		  return new Promise(resolve => setTimeout(resolve, 300));
		}
		async function delayedLog(item) {
		  await delay();
		  var sum = item.reduce((a, b) => a + b, 0);
		  var formatsum = Number(sum).toFixed(2);
		  document.getElementById('earned').textContent = formatsum;
		}
		async function processArray(rwdArray) {
		  for (const item of rwdArray) {
			await delayedLog(item);
		  }
		}
		return processArray([rwdArray]);
	  }

	  async function rewinfo() {
		var tokenid = Number(document.querySelector("[name=stkid2]").value);
		var rawearn = await vaultcontract.methods.earningInfo(account, ([tokenid])).call();
		var earned =  String(rawearn).split(",")[0];
		var earnedrwd = Web3.utils.fromWei(earned);
		var rewards = Number(earnedrwd).toFixed(2);
		document.getElementById('earned1').textContent = rewards;
	  }

	  async function claimit1() {
		var tokenids = Number(document.querySelector("[name=stkid3]").value);
		vaultcontract.methods.claim([tokenids]).send({from: account});
	}

  return (


    <div className="App" style={{background:"linear-gradient(90deg, rgba(2,0,36,1) 15%, rgba(118,9,121,1) 79%)", margin:"auto ", width:"auto", height:"auto"}}>
	

      <div className="container"  >
	  <div class="card" style={{border:"0",borderRadius:"0",background:"linear-gradient(90deg, rgba(2,0,36,1) 15%, rgba(118,9,121,1) 79%)", marginTop:"auto",marginBottom:"auto",}}>
         <div className="row" style={{color:"white"}}>


          <h1 className="mt-5" style={{color:"#FFF",fontWeight:"bold",textShadow:"1px 1px 10px #000"}} >WELCOME TO MPN PROJECT NFT WEB3 PORTAL</h1>
          <h5 className="mt-2" style={{color:"#FFF", textShadow:"1px 1px 10px #000"}} >MINT STAKE CLAIM TRADE</h5>      
		
		<div style={{marginTop:"13px"}}>
          <Button onClick={connectwallet} style={{margin: "10px"}}>CONNECT WALLET</Button>

		  <Button onClick={enable} style={{margin: "10px"}}>APPROVE YOUR WALLET TO STAKE</Button>

		  <div class="card" id="wallet-address" style={{background:"transparent", marginTop:"30px", boxShadow:"1px 1px 10px #000000",}}>
            <label for="floatingInput" >Your Wallet Addres</label>
            </div>
		 
			<form class="col-lg-5"  style={{marginLeft:"auto", marginRight:"auto", marginTop:"auto"}}>
         <div class="card" style={{background:"#000000", marginTop:"40px", boxShadow:"1px 1px 10px #000000",}}>
            <label for="floatingInput" >MINT YOUR MPN NOW {balance.result}/1000</label>
            </div>

            <div class="card" style={{background:"", marginTop:"5px", boxShadow:"1px 1px 10px #000000"}}>
            
			<div className="row mt-2">
		  <div className="col xs={10} md={8}">

			
		   <button style={{marginRight:"2px", backgroundColor:"transparent", border:"0"}}>
		   <img src="art.png" alt="Crypto Phoenix NFT" width="90" height="90"/>
		 </button>
		 <button style={{marginRight:"2px", backgroundColor:"transparent", border:"0"}}>
		 <img src="art.png" alt="Crypto Phoenix NFT" width="90" height="90"/>
		 </button>
		 <button style={{marginRight:"2px", backgroundColor:"transparent", border:"0"}}>
		 <img src="art.png" alt="Crypto Phoenix NFT" width="90" height="90"/>
		 </button>
		 <button style={{marginRight:"2px", backgroundColor:"transparent", border:"0"}}>
		 <img src="art.png" alt="Crypto Phoenix NFT" width="90" height="90"/>
		 </button>
		</div>
		</div>
			
		
			<ButtonToolbar style={{marginLeft:"auto", marginRight:"auto", marginTop:"auto"}}>
          
  				<ButtonGroup size="lg" className="mb-2 mt-2" 
				  aria-label="First group"
				  name="amount"
				  onClick={nftamount => this.handleNFT(nftamount, "value")}
				>
    				<Button value="1">1</Button>
					<Button value="2">2</Button>
					<Button value="3">3</Button>
					<Button value="4">4</Button>
					<Button value="5">5</Button>
					
  				</ButtonGroup>
			</ButtonToolbar>
            <Button onClick={mint}>MINT</Button>
            </div>
            </form>

		  </div>

		 

		<form class="col-lg-5"  style={{marginLeft:"auto", marginRight:"auto", marginTop:"auto"}}>
          <div class="card" style={{background:"#000000", marginTop:"40px", boxShadow:"1px 1px 10px #000000",}}>
            <label for="floatingInput" >STAKE YOUR MPN HERE</label>
            </div>
            <div class="card" style={{background:"", marginTop:"5px", boxShadow:"1px 1px 10px #000000"}}>
			<label style={{marginTop:"auto",marginBottom:"auto",color:"#000",fontSize:"12px" }}>PLEASE INPUT MPN ID</label>
			<input type="number" name="stkid" defaultValue="0" min="1"  style={{ marginTop:"auto",marginBottom:"9px",textAlign:"center"}}/>
            <Button onClick={stakeit}>STAKE</Button>
            </div>
            <div class="card" id="wallet-address" style={{background:"#000000", marginTop:"40px", boxShadow:"1px 1px 10px #000000",}}>
            <label for="floatingInput" >UNSTAKE YOUR MPN HERE</label>
            </div>
            <div class="card" style={{background:"", marginTop:"5px", boxShadow:"1px 1px 10px #000000"}}>
			<label style={{marginTop:"auto",marginBottom:"auto",color:"#000",fontSize:"12px" }}>PLEASE INPUT MPN ID</label>
			<input type="number" name="stkid1" defaultValue="0" min="1"  style={{ marginTop:"auto",marginBottom:"9px",textAlign:"center"}}/>
            <Button onClick={unstakeit}>UNSTAKE</Button>
            </div>

			<div class="card" style={{background:"#000000", marginTop:"40px", boxShadow:"1px 1px 10px #000000",}}>
            <label for="floatingInput" >CHECK YOUR STAKE TOTAL</label>
            </div>
    <div class="card" style={{background:"", marginTop:"5px", boxShadow:"1px 1px 10px #000000"}}>
     
	 <div id='stakedbalance' style={{marginTop:"10px",marginBottom:"10px",color:"#000",fontWeight:"bold", fontSize:"19px" }}>
      <label for="floatingInput">STAKED</label></div>
      <Button onClick={verify}>CHECK</Button>
			</div>

			<div class="card" style={{background:"#000000", marginTop:"40px", boxShadow:"1px 1px 10px #000000",}}>
            <label for="floatingInput" >CHECK YOUR REWARDS TOTAL</label>
            </div><div class="card" style={{background:"", marginTop:"5px", boxShadow:"1px 1px 10px #000000"}}>
			<div id='earned' style={{marginTop:"10px",marginBottom:"10px",color:"#000",fontWeight:"bold", fontSize:"19px" }}>
            <label for="floatingInput">0</label></div><Button onClick={rewardinfo}>CHECK</Button>
            </div>
            <div class="card" style={{background:"#000000", marginTop:"40px", boxShadow:"1px 1px 10px #000000",}}>
            <label for="floatingInput" >CHECK YOUR REWARDS BY ID</label>
            </div>
            <div class="card" style={{background:"", marginTop:"5px", boxShadow:"1px 1px 10px #000000"}}>
			<label style={{marginTop:"auto",marginBottom:"auto",color:"#000",fontSize:"12px" }}>PLEASE INPUT MPN ID</label>
			
			<input name="stkid2" defaultValue="0" min="1"  style={{ marginTop:"auto",marginBottom:"auto",textAlign:"center"}}/>
            <div id='earned1' style={{marginTop:"10px",marginBottom:"10px",color:"#000",fontWeight:"bold", fontSize:"19px",textAlign:"center" }}>
            <label for="floatingInput"style={{ marginTop:"1px",marginBottom:"1px",textAlign:"center"}}>REWARDS</label></div>
			<Button onClick={rewinfo}>CHECK</Button>
            </div>
            <div class="card" style={{background:"#000000", marginTop:"40px", boxShadow:"1px 1px 10px #000000",}}>
            <label for="floatingInput" >CLAIM YOUR REWARDS BY ID</label>
            </div>
            <div class="card" style={{background:"", marginTop:"5px", boxShadow:"1px 1px 10px #000000"}}>
			<label style={{marginTop:"auto",marginBottom:"auto",color:"#000",fontSize:"12px" }}>PLEASE INPUT MPN ID</label>
			<input type="number" name="stkid3" defaultValue="0" min="1"  style={{ marginTop:"auto",marginBottom:"9px",textAlign:"center"}}/>
            <Button onClick={claimit1}>CLAIM</Button>
            </div>
			<div class="card" style={{background:"#000000", marginTop:"40px", boxShadow:"1px 1px 10px #000000",}}>
            <label for="floatingInput" >CLAIM YOUR REWARDS BY ALL STAKED</label>
            </div><div class="card" style={{background:"", marginTop:"5px", boxShadow:"1px 1px 10px #000000"}}>
			<Button onClick={claimit}>CLAIM</Button></div>
			</form>

			
		  </div>

		  <div className="card"style={{background:"transparent", marginTop:"30px",border:"0",}}>
  <div className="ml-3 mr-3" style={{display: "inline-grid",gridTemplateColumns: "repeat(4, 5fr)",columnGap: "10px"}}>
  {nftdata.map((result, i )=> {
	    	
	  return (
			<div className="card mt-3"style={{background:"transparent", marginTop:"10px", boxShadow:"1px 1px 10px #000000",}} key={i} >
            		<div className="image-over">
					<img className="card-img-top"  src={nftpng + result.token_id +'.png'} alt="" />
					</div>
					<div className="card-body">
					<div class="card" style={{background:"#000000", marginTop:"auto", boxShadow:"1px 1px 10px #000000",}}>
            <label for="floatingInput" style={{marginTop:"auto",marginBottom:"auto",color:"#fff",fontSize:"15px" }}>MPN {result.token_id}</label>
            </div>
	  </div>
	</div>
    
    
        );
    })}
	</div>
	
</div>
  </div>
	</div>
	<div class="card" style={{background:"transparent", marginTop:"50px", boxShadow:"1px 1px 20px #000000",bordedr:"0",borderRadius:"0"}}>
	<label for="floatingInput" style={{marginTop:"auto",marginBottom:"auto",color:"#fff",fontSize:"15px" }}>MPN PROJECT</label>
    </div>
 	</div>
  			);
	};
}

export default App;
