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

    it('FreeMint Start Time', async function() {
        const app = this.app as App
        const FreeMint = app.FreeMint

        const { timestamp } = await ethers.provider.getBlock('latest')
        await expect(
            FreeMint.connect(this.user).setMintTime(now(timestamp)+10, now(timestamp)+10000000),
        ).reverted

        await expect(
            FreeMint.setMintTime(now(timestamp)-1000, now(timestamp)+10000000)
        ).reverted

        await FreeMint.setMintTime(now(timestamp)+10, now(timestamp)+10000000)

        await expect(
            FreeMint.setMintTime(now(timestamp)+100, now(timestamp)+10000000)
        ).reverted
    })

    it('FreeMint Mint', async function () {
        const app = this.app as App
        const FreeMint = app.FreeMint.connect(this.user)
        await expect(FreeMint.mint(1)).reverted //'not start'
        await increaseBlockTime(duration.seconds(BigNumber.from(10)))
        await FreeMint.mint(1)
        await expect(FreeMint.mint(1)).reverted // 'already minted'
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