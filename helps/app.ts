/* eslint-disable camelcase */
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'
import {MondayAPE__factory, MockAPE__factory,MockBendDAO__factory, MemberCard__factory, AuthAPE__factory} from '../typechain'
import {MondayAPE, MockAPE,MockBendDAO, AuthAPE,MemberCard} from '../typechain'
import {HardhatUpgrades} from '@openzeppelin/hardhat-upgrades';

/**
 * App is the application that deploy whitelist contracts for test.
 */
export class App {
    MondayAPE!:MondayAPE
    MockAPE!:MockAPE
    MockBAPE!:MockBendDAO
    AuthAPE!:AuthAPE
    MemberCard!:MemberCard

    async deployMock() {
        const [deployer] = await this.signers
        this.MockAPE = await (new MockAPE__factory(deployer)).deploy()
        this.MockBAPE = await (new MockBendDAO__factory(deployer)).deploy(this.MockAPE.address)
    }

    async deployMemberCard(BAPE:string, APE:string) {
        const [deployer] = await this.signers
        const _MemberCard = await this.upgrades.deployProxy(new MemberCard__factory(deployer), [BAPE, APE])
        this.MemberCard = _MemberCard as MemberCard
        return _MemberCard
    }

    async deployMondayAPE() {
        const [deployer] = await this.signers
        const _MondayAPE = await this.upgrades.deployProxy(new MondayAPE__factory(deployer), [])
        this.MondayAPE = _MondayAPE as MondayAPE
        return this.MondayAPE 
    }

    async deployAuthAPE(MondayAPE:string) {
        const [deployer] = await this.signers
        const _AuthAPE = await this.upgrades.deployProxy(new AuthAPE__factory(deployer), [MondayAPE])
        this.AuthAPE = _AuthAPE as AuthAPE
        return this.AuthAPE
    }

    async deployAll(BAPE?:string, APE?:string) {
        if(BAPE === undefined || APE === undefined) {
            await this.deployMock()
            BAPE = this.MockBAPE.address
            APE = this.MockAPE.address
        }
        const MemberCard = await this.deployMemberCard(BAPE as string, APE as string);
        const MondayAPE = await this.deployMondayAPE();
        const AuthAPE = await this.deployAuthAPE(MemberCard.address);
        await MemberCard.setMondayAPE(MondayAPE.address)
        await MondayAPE.setController(MemberCard.address)
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
