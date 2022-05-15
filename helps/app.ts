/* eslint-disable camelcase */
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'
import {MondayAPE__factory, MockAPE__factory,MockBAPE__factory, MintPass__factory, AuthAPE__factory} from '../typechain'
import {MondayAPE, MockAPE,MockBAPE,AuthAPE,MintPass} from '../typechain'

/**
 * App is the application that deploy whitelist contracts for test.
 */
export class App {
    MondayAPE!:MondayAPE
    MockAPE!:MockAPE
    MockBAPE!:MockBAPE
    AuthAPE!:AuthAPE
    MintPass!:MintPass

    async deployMock() {
        const [deployer] = await this.signers
        this.MockAPE = await (new MockAPE__factory(deployer)).deploy()
        this.MockBAPE = await (new MockBAPE__factory(deployer)).deploy(this.MockAPE.address)
    }

    async deployAll(BAPE?:string, APE?:string) {
        if(BAPE === undefined || APE === undefined) {
            await this.deployMock()
            BAPE = this.MockBAPE.address
            APE = this.MockAPE.address
        }
        const [deployer] = await this.signers
        this.MondayAPE = await (new MondayAPE__factory(deployer)).deploy(BAPE, APE)
        const AuthAPE = await this.MondayAPE.AUTH_APE()
        const MintPass = await this.MondayAPE.MINTPASS()
        this.AuthAPE = AuthAPE__factory.connect(AuthAPE, deployer)
        this.MintPass = MintPass__factory.connect(MintPass, deployer)
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
}
