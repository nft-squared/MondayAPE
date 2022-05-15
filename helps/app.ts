/* eslint-disable camelcase */
import '@nomiclabs/hardhat-ethers';
import '@openzeppelin/hardhat-upgrades';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'
import {MondayAPE__factory, MockAPE__factory,MockBAPE__factory, MintPass__factory, AuthAPE__factory} from '../typechain'
import {MondayAPE, MockAPE,MockBAPE,AuthAPE,MintPass} from '../typechain'
import {deployF, contractAtF} from './deployer';

/**
 * App is the application that deploy whitelist contracts for test.
 */
export class App {
    MondayAPE!:MondayAPE
    MockAPE!:MockAPE
    MockBAPE!:MockBAPE
    AuthAPE!:AuthAPE
    MintPass!:MintPass
    /** Create the App from hardhat */
    constructor() {
        const hre = require('hardhat');
        const app = hre.app; // init in hardhat.config.ts
        if (app) {
            Object.assign(this, app);
        }
    }

    async deployMock() {
        this.MockAPE = await deployF(MockAPE__factory, [])
        this.MockBAPE = await deployF(MockBAPE__factory, [this.MockAPE.address])
    }

    async deployAll(BAPE?:string, APE?:string) {
        if(BAPE === undefined || APE === undefined) {
            await this.deployMock()
            BAPE = this.MockBAPE.address
            APE = this.MockAPE.address
        }
        this.MondayAPE = await deployF(MondayAPE__factory, [BAPE, APE])
        const AuthAPE = await this.MondayAPE.AUTH_APE()
        const MintPass = await this.MondayAPE.MINTPASS()
        this.AuthAPE = await contractAtF(AuthAPE__factory, AuthAPE)
        this.MintPass = await contractAtF(MintPass__factory, MintPass)
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
