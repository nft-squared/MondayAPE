import chai from 'chai'
import {solidity} from 'ethereum-waffle'
import {ethers} from 'hardhat'
import { BigNumber } from 'ethers'

import { App } from '../helps/app'
import {increaseBlockTime, duration} from './helps/time'
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'
import MerkleTree from 'merkletreejs'

chai.use(solidity);
const {expect} = chai;

const now = ()=> Math.floor(Number(new Date())/1000)

describe('AllTest', () => {
    before(async function() {
        const app = new App()
        await app.deployAll()
        this.app = app;
        this.signers = await ethers.getSigners();
        const [admin, user] = this.signers;
        this.admin = admin;
        this.user = user;
        const mockAPE = app.MockAPE.connect(user)
        const mockBAPE = app.MockBAPE.connect(user)
        await mockAPE.setApprovalForAll(mockBAPE.address, true)
        await app.MockAPE.setApprovalForAll(mockBAPE.address, true)
        await mockAPE.mint(admin.address, 1000)
        await app.MockBAPE.mint(1000)

        for(let i = 0; i < 20; i++) {
            await mockAPE.mint(user.address, i)
            if(i >= 10) await mockBAPE.mint(i)
        }
    });

    it('MintPass Start Time', async function() {
        const app = this.app as App
        const mintPass = app.MintPass
        await expect(
            mintPass.connect(this.user).setMintTime(now()+10),
        ).reverted // ErrOnlyOnwer
        await expect(
            mintPass.setMintTime(now()-1000)
        ).reverted
        await mintPass.setMintTime(now()+30)
        await expect(
            mintPass.setMintTime(now()+100)
        ).reverted
    })

    it('MintPass Mint', async function () {
        const app = this.app as App
        const mintPass = app.MintPass.connect(this.user)
        await expect(mintPass.mint(1)).reverted //'not start'
        await increaseBlockTime(duration.seconds(BigNumber.from(10)))
        await expect(mintPass.mint(1)).reverted // 'invalid ethers amount'
        const MINT_PRICE = await mintPass.MINT_PRICE()
        const TOTAL_SUPPLY = await mintPass.MAX_SUPPLY() 
        await expect(
            mintPass.mint(TOTAL_SUPPLY.add(1), {value:MINT_PRICE.mul(TOTAL_SUPPLY.add(1))})
        ).reverted // 'sold out'
        await mintPass.mint(10, {value: MINT_PRICE.mul(10)})
    })
    
    it('MintPass SetURI', async function () {
        const app = this.app as App
        const mintPass = app.MintPass
        await expect(mintPass.connect(this.user).setURI("xxx")).reverted
        await mintPass.setURI("https://")
        await mintPass.setURI("ipfs://")
    })

    it('MintPass Withdraw', async function () {
        const app = this.app as App
        const mintPass = app.MintPass
        await expect(mintPass.connect(this.user).withdraw()).reverted
        const before = await ethers.provider.getBalance(this.admin.address)
        await mintPass.connect(this.admin).withdraw()
        const after = await ethers.provider.getBalance(this.admin.address)
        expect(after.sub(before)).gt(0)
    })

    it('MintPass Merkle Claim', async function () {
        const app = this.app as App
        const mintPass = app.MintPass
        const signers = this.signers as SignerWithAddress[]
        const keccak256 = ethers.utils.keccak256
        const encodePacked= ethers.utils.solidityPack
        const airdropList = signers.map(signer=>[signer.address, parseInt(signer.address.slice(-1), 16)%5+1])
        const leaves = airdropList.map(airdrop=>keccak256(encodePacked(['address','uint256'], airdrop))) // leaves is the keccak256(address) list
        const tree = new MerkleTree(leaves, keccak256, {sort:true})
        const root = tree.getHexRoot()
        await expect(mintPass.connect(this.user).setMerkleRoot(root)).reverted // onlyOwner
        await mintPass.setMerkleRoot(root)
        await expect(mintPass.setMerkleRoot(root)).reverted // change root hash again
        const AirdropMerkleRoot = await mintPass.AirdropMerkleRoot()
        expect(AirdropMerkleRoot).equal(root)
        for(const i in signers) {
            const signer = signers[i]
            const amount = airdropList[i][1]
            const leafHash = keccak256(encodePacked(['address','uint256'], airdropList[i]))
            const proof = tree.getHexProof(leafHash)
            await mintPass.connect(signer).claim(proof, amount)
            await expect(mintPass.connect(signer).claim(proof, amount)).reverted // claim twice
        }
    })

    it('MondayAPE Start Time', async function() {
        const app = this.app as App
        const mondayAPE = app.MondayAPE
        await expect(mondayAPE.connect(this.user).setMintTime(now()+10)).reverted // OnlyOnwer
        await expect(mondayAPE.setMintTime(now()-1000)).reverted // 'setMintTime'
        await mondayAPE.setMintTime(now()+300)
        await expect(mondayAPE.setMintTime(now()+3000)).reverted // 'setMintTime'
    })

    it('MondayAPE Mint', async function () {
        const app = this.app as App
        const mondayAPE = app.MondayAPE.connect(this.user)
        await expect(mondayAPE.mint(0, 2)).reverted // 'not start'
        await increaseBlockTime(duration.seconds(BigNumber.from(400)))
        await expect(mondayAPE.mint(0, 200)).reverted // failed, only have 10 mint pass
        await expect(mondayAPE.mint(1000, 2)).reverted //  'only APE owner'
        const LIMIT_PER_APE = 30
        await expect(mondayAPE.mint(0, LIMIT_PER_APE+1)).reverted // 'exceed Limit Per APE'
        await mondayAPE.mint(0, 2)
        await mondayAPE.mint(15, 2)
    })


    it('MondayAPE SetURI', async function () {
        const app = this.app as App
        const mondayAPE = app.MondayAPE
        await expect(mondayAPE.connect(this.user).setURI("xxx")).reverted
        await mondayAPE.setURI("https://")
        await mondayAPE.setURI("ipfs://")
    })
    

    it('AuthAPE Auth', async function () {
        const app = this.app as App
        const AuthAPE = app.AuthAPE.connect(this.user)
        const message = Buffer.alloc(32)
        message.write("hello world!");
        expect(AuthAPE.auth(1000, message)).reverted
        AuthAPE.auth(1, message)
    })
    
})