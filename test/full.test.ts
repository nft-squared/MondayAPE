import chai from 'chai';
import {solidity} from 'ethereum-waffle';
import {ethers} from 'hardhat';
import { BigNumber } from 'ethers';

import { App } from '../helps/app'
import {increaseBlockTime, duration} from './helps/time';

chai.use(solidity);
const {expect} = chai;

const now = ()=> Math.floor(Number(new Date())/1000)

const ErrOnlyOnwer = 'Ownable: caller is not the owner'
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
        ).to.be.reverted // ErrOnlyOnwer
        await expect(
            mintPass.setMintTime(now()-1000)
        ).to.be.reverted
        await mintPass.setMintTime(now()+30)
        await expect(
            mintPass.setMintTime(now()+100)
        ).to.be.reverted
    })

    it('MintPass Mint', async function () {
        const app = this.app as App
        const mintPass = app.MintPass.connect(this.user)
        await expect(mintPass.mint(1)).to.be.reverted //'not start'
        await increaseBlockTime(duration.seconds(BigNumber.from(10)))
        await expect(mintPass.mint(1)).to.be.reverted // 'invalid ethers amount'
        const MINT_PRICE = await mintPass.MINT_PRICE()
        const TOTAL_SUPPLY = await mintPass.TOTAL_SUPPLY() 
        await expect(
            mintPass.mint(TOTAL_SUPPLY.add(1), {value:MINT_PRICE.mul(TOTAL_SUPPLY.add(1))})
        ).to.be.reverted // 'sold out'
        await mintPass.mint(10, {value: MINT_PRICE.mul(10)})
    })
    
    it('MintPass SetURI', async function () {
        const app = this.app as App
        const mintPass = app.MintPass
        await expect(mintPass.connect(this.user).setURI("xxx"), ErrOnlyOnwer).to.be.reverted
        await mintPass.setURI("https://")
        await mintPass.setURI("ipfs://")
    })

    it('MintPass Withdraw', async function () {
        const app = this.app as App
        const mintPass = app.MintPass
        await expect(mintPass.connect(this.user).withdraw(), ErrOnlyOnwer).to.be.reverted
        const before = await ethers.provider.getBalance(this.admin.address)
        await mintPass.connect(this.admin).withdraw()
        const after = await ethers.provider.getBalance(this.admin.address)
        expect(after.sub(before)).gt(0)
    })

    it('MondayAPE Start Time', async function() {
        const app = this.app as App
        const mondayAPE = app.MondayAPE
        await expect(mondayAPE.connect(this.user).setMintTime(now()+10)).to.be.reverted // OnlyOnwer
        await expect(mondayAPE.setMintTime(now()-1000)).to.be.reverted // 'setMintTime'
        await mondayAPE.setMintTime(now()+300)
        await expect(mondayAPE.setMintTime(now()+3000)).to.be.reverted // 'setMintTime'
    })

    it('MondayAPE Mint', async function () {
        const app = this.app as App
        const mondayAPE = app.MondayAPE.connect(this.user)
        await expect(mondayAPE.mint(0, 2)).to.be.reverted // 'not start'
        await increaseBlockTime(duration.seconds(BigNumber.from(400)))
        await expect(mondayAPE.mint(0, 200)).to.be.reverted // failed, only have 10 mint pass
        await expect(mondayAPE.mint(1000, 2)).to.be.reverted //  'only APE owner'
        const LIMIT_PER_APE = 30
        await expect(mondayAPE.mint(0, LIMIT_PER_APE+1)).to.be.reverted // 'exceed Limit Per APE'
        await mondayAPE.mint(0, 2)
        await mondayAPE.mint(15, 2)
        await mondayAPE.batchMint([1,16], [2,2])
    })


    it('MondayAPE SetURI', async function () {
        const app = this.app as App
        const mondayAPE = app.MondayAPE
        await expect(mondayAPE.connect(this.user).setURI("xxx"), ErrOnlyOnwer).to.be.reverted
        await mondayAPE.setURI("https://")
        await mondayAPE.setURI("ipfs://")
    })
    

    it('AuthAPE Auth', async function () {
        const app = this.app as App
        const AuthAPE = app.AuthAPE.connect(this.user)
        const message = Buffer.alloc(32)
        message.write("hello world!");
        expect(AuthAPE.auth(1000, message)).to.be.reverted
        AuthAPE.auth(1, message)
    })
    
})