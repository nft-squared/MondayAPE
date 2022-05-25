/* eslint-disable camelcase */
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'
import {MondayAPE__factory, MockAPE__factory,MockBendDAO__factory, MintPass__factory, AuthAPE__factory} from '../typechain'
import {MondayAPE, MockAPE,MockBendDAO, AuthAPE,MintPass} from '../typechain'
import {HardhatUpgrades} from '@openzeppelin/hardhat-upgrades';

/**
 * App is the application that deploy whitelist contracts for test.
 */
export class App {
    MondayAPE!:MondayAPE
    MockAPE!:MockAPE
    MockBAPE!:MockBendDAO
    AuthAPE!:AuthAPE
    MintPass!:MintPass

    async deployMock() {
        const [deployer] = await this.signers
        this.MockAPE = await (new MockAPE__factory(deployer)).deploy()
        this.MockBAPE = await (new MockBendDAO__factory(deployer)).deploy(this.MockAPE.address)
    }

    async deployMintPass() {
        const [deployer] = await this.signers
        const _MintPass = await this.upgrades.deployProxy(new MintPass__factory(deployer), [])
        this.MintPass = _MintPass as MintPass
        return _MintPass
    }
    async deployMondayAPE(BAPE:string, APE:string, MintPass:string) {
        const [deployer] = await this.signers
        const _MondayAPE = await this.upgrades.deployProxy(new MondayAPE__factory(deployer), [BAPE, APE, MintPass])
        this.MondayAPE = _MondayAPE as MondayAPE
        return _MondayAPE
    }
    async deployAuthAPE(MondayAPE:string) {
        const [deployer] = await this.signers
        const _AuthAPE = await this.upgrades.deployProxy(new AuthAPE__factory(deployer), [MondayAPE])
        this.AuthAPE = _AuthAPE as AuthAPE
        return _AuthAPE
    }
    async deployAll(BAPE?:string, APE?:string) {
        if(BAPE === undefined || APE === undefined) {
            await this.deployMock()
            BAPE = this.MockBAPE.address
            APE = this.MockAPE.address
        }
        const MintPass = await this.deployMintPass();
        const MondayAPE = await this.deployMondayAPE(BAPE, APE, MintPass.address);
        const AuthAPE = await this.deployAuthAPE(MondayAPE.address);
        await MintPass.setMondayAPE(MondayAPE.address)
    }

    /**
     * Signers from hardhat.
     * @return {SignerWithAddress[]} the signers wallets from hardhat
     */
    get signers(): Promise<SignerWithAddress[]> {
        const hre = require('hardhat');
        const {ethers} = hre;
        return ethers.getSigners();
    }

    get upgrades(): HardhatUpgrades{
        return require('hardhat').upgrades;
    }
}
