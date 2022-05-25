import chai from 'chai'
import {solidity} from 'ethereum-waffle'
import {FindAPETest__factory} from '../typechain'
import {ethers} from 'hardhat'

chai.use(solidity);
const {expect} = chai;

const RndInt=(max:number)=>Math.floor(Math.random()*max)

describe('FindAPETest', () => {
    it('FindAPE test', async function() {
        const [deployer] = await ethers.getSigners();
        const factory = new FindAPETest__factory(deployer);
        const FindAPETest = await factory.deploy();
        const MaxSupply = 1000;
        this.timeout(MaxSupply*1000);
        let totalSupply = 0;
        const findAPE:{[mapeId:number]:number} = {}
        const recordMintLog = (apeId:number, quantity:number, curSupply:number) => {
            for(let i = 0; i < quantity; i++) findAPE[curSupply+i] = apeId;
        }
        while(totalSupply < MaxSupply) {
            const apeId = RndInt(20000);
            const quantity = Math.min(1 + RndInt(30), MaxSupply-totalSupply);
            recordMintLog(apeId, quantity, totalSupply);
            await FindAPETest.mintMock(apeId, quantity, {gasLimit:1000000});
            totalSupply += quantity;
        }
        expect(totalSupply).equal(MaxSupply);
        for(let mapeId = 0; mapeId < totalSupply; mapeId ++) {
            const apeId = await FindAPETest.findAPE(mapeId)
            expect(apeId.toNumber()).equal(findAPE[mapeId])
        }
    })
})