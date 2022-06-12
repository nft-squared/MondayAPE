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

const now = (min = 0)=> {
    const x = Math.floor(Number(new Date())/1000)
    return x<min ? min : x
}

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

    it('MemberCard Start Time', async function() {
        const app = this.app as App
        const memberCard = app.MemberCard

        const { timestamp } = await ethers.provider.getBlock('latest')
        
        await expect(
            memberCard.connect(this.user).setMintTime(now(timestamp)+10),
        ).reverted

        await expect(
            memberCard.setMintTime(now(timestamp)-1000)
        ).reverted

        await memberCard.setMintTime(now(timestamp)+10)

        await expect(
            memberCard.setMintTime(now(timestamp)+100)
        ).reverted
    })

    it('MemberCard Mint', async function () {
        const app = this.app as App
        const memberCard = app.MemberCard.connect(this.user)
        await expect(memberCard.mint(1)).reverted //'not start'
        await increaseBlockTime(duration.seconds(BigNumber.from(10)))
        await expect(memberCard.mint(1)).reverted // 'invalid ethers amount'
        const CARD_PRICE = await memberCard.CARD_PRICE()
        const TOTAL_SUPPLY = await memberCard.MAX_SUPPLY() 
        await expect(
            memberCard.mint(TOTAL_SUPPLY.add(1), {value:CARD_PRICE.mul(TOTAL_SUPPLY.add(1))})
        ).reverted // 'sold out'
        await memberCard.mint(10, {value: CARD_PRICE.mul(10)})
    })
    
    it('MemberCard SetURI', async function () {
        const app = this.app as App
        const memberCard = app.MemberCard
        await expect(memberCard.connect(this.user).setURI("xxx")).reverted
        await memberCard.setURI("https://")
        await memberCard.setURI("ipfs://")
    })

    it('MemberCard Withdraw', async function () {
        const app = this.app as App
        const memberCard = app.MemberCard
        await expect(memberCard.connect(this.user).withdraw()).reverted
        const before = await ethers.provider.getBalance(this.admin.address)
        await memberCard.connect(this.admin).withdraw()
        const after = await ethers.provider.getBalance(this.admin.address)
        expect(after.sub(before)).gt(0)
    })

    it('MemberCard Merkle Claim', async function () {
        const app = this.app as App
        const memberCard = app.MemberCard
        const signers = this.signers as SignerWithAddress[]
        const keccak256 = ethers.utils.keccak256
        const encodePacked= ethers.utils.solidityPack
        const airdropList = signers.map(signer=>[signer.address, parseInt(signer.address.slice(-1), 16)%5+1])
        const leaves = airdropList.map(airdrop=>keccak256(encodePacked(['address','uint256'], airdrop))) // leaves is the keccak256(address) list
        const tree = new MerkleTree(leaves, keccak256, {sort:true})
        const root = tree.getHexRoot()
        await expect(memberCard.connect(this.user).setMerkleRoot(root)).reverted // onlyOwner
        await memberCard.setMerkleRoot(root)
        await expect(memberCard.setMerkleRoot(root)).reverted // change root hash again
        const AirdropMerkleRoot = await memberCard.AirdropMerkleRoot()
        expect(AirdropMerkleRoot).equal(root)
        for(const i in signers.slice(0,-1)) {
            const signer = signers[i]
            const amount = airdropList[i][1]
            const leafHash = keccak256(encodePacked(['address','uint256'], airdropList[i]))
            const proof = tree.getHexProof(leafHash)
            await memberCard.connect(signer).claim(proof, amount)
            await expect(memberCard.connect(signer).claim(proof, amount)).reverted // claim twice
        }
    })

    it('MondayAPE Mint', async function () {
        const app = this.app as App
        const mondayAPE = app.MondayAPE.connect(this.user)
        await expect(mondayAPE.mint(this.admin.address, 0, 2)).reverted
        const memberCard = app.MemberCard
        await expect(memberCard.mintMAPE(0, 1)).reverted
        const signers = this.signers as SignerWithAddress[]
        const user1 = signers.slice(-1)[0]

        const CARD_PRICE = await memberCard.CARD_PRICE()
        const MAPE_PRICE = await memberCard.MAPE_PRICE()
        await memberCard.connect(user1).mintMAPE(0, 1, {value:MAPE_PRICE})
        await expect(memberCard.connect(user1).mintMAPE(0, 1, {value:MAPE_PRICE})).reverted
        await expect(memberCard.connect(user1).mintMAPE(0, 1<<31, {value:MAPE_PRICE})).reverted
        await expect(memberCard.mintMAPE(0, 1<<31, {value:CARD_PRICE.sub(MAPE_PRICE)})).reverted
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