// @todo: refactor this

import {
    GetContractTypeFromFactory,
    GetARGsTypeFromFactory,
} from '../typechain/common';
// const { ethers, upgrades } = hre;
import {Signer, Contract} from 'ethers';
import fs from 'fs';
const record = require('./record');

type ContractT<T extends
    {new(...args:any[]):any}> = GetContractTypeFromFactory<InstanceType<T>>
type InitParams<T> = T extends {initialize(...args:infer P):any} ? P : never
type DeployParams<T extends
    {new(...args:any[]):any}> = GetARGsTypeFromFactory<InstanceType<T>>


type VALUE = {[key:string]:string|VALUE}

// convert json to ts
function toTsType(TypeMapping:VALUE) {
    const importSet = new Set<string>();
    // let str = 'type APP = '
    const doObj = (obj:VALUE) => {
        let appBody = '{';
        const entries = Object.entries(obj);
        for (const i in entries) {
            const [key, value] = entries[i];
            if (typeof value == 'string') importSet.add(value);
            const dovalue = typeof value == 'string' ? value : doObj(value);
            appBody += `${Number(i)>0?',':''}${key}:${dovalue}`;
        }
        appBody += '}';
        return appBody;
    };
    const bodyStr = doObj(TypeMapping);
    const importStr = [...importSet].join(',');
    return `import {${importStr}} from './typechain';type APP=${bodyStr}`;
}

export async function deploy<T extends Contract>(
    ContractName: string,
    args: any[] = [],
    path: string[] = [ContractName],
): Promise<T> {
    const hre = require('hardhat'); const {ethers} = hre;
    const deployed = path.length > 0 ? record(hre.Record)._path(path) : undefined;
    if (deployed && !process.argv.includes('--reset')) return contractAt(ContractName, deployed);
    const factory = await ethers.getContractFactory(ContractName);
    console.log(`>> Deployed ${ContractName}(${args})...`);
    const contract = await factory.deploy(...args);
    contract.NEW = true;
    record(hre.Record, path, contract.address);
    if (path.length > 0) {
        const newR = record(hre.Record, ['__MAPPING__', ...path], ContractName);
        if (hre.AppFile) fs.writeFileSync(hre.AppFile, toTsType(newR['__MAPPING__']));
    }
    console.log(`   Deployed ${ContractName}(${args}) at ${contract.address}`);
    return contract;
}

export async function deployProxy<T extends Contract>(
    ContractName: string,
    args: any[] = [],
    path: string[] = [ContractName],
): Promise<T> {
    const hre = require('hardhat'); const {ethers, upgrades} = hre;
    const deployed = path.length > 0 ? record(hre.Record)._path(path) : undefined;
    if (deployed && !process.argv.includes('--reset')) return contractAt(ContractName, deployed);
    const factory = await ethers.getContractFactory(ContractName);
    console.log(`>> DeployedProxy ${ContractName}(${args})...`);
    const proxyed = await upgrades.deployProxy(factory, args);
    await proxyed.deployed();
    proxyed.NEW = true;
    record(hre.Record, path, proxyed.address);
    if (path.length > 0) {
        const newR = record(hre.Record, ['__MAPPING__', ...path], ContractName);
        if (hre.AppFile) fs.writeFileSync(hre.AppFile, toTsType(newR['__MAPPING__']));
    }
    console.log(`   DeployedProxy ${ContractName}(${args}) at ${proxyed.address}`);
    return proxyed as any;
}

export async function upgradeProxy<T extends Contract>(address:string, ContractName:string): Promise<T> {
    const hre = require('hardhat'); const {ethers, upgrades} = hre;
    const DeployedBytecode = await hre.artifacts.readArtifact(ContractName).then((x:any)=>x.deployedBytecode);
    if (await implCheck(address, DeployedBytecode)) {
        console.log(`>> SameImpl ${ContractName} at ${address}`);
        return contractAt(ContractName, address);
    }
    const factory = await ethers.getContractFactory(ContractName);
    const contract = await upgrades.upgradeProxy(address, factory);
    contract.NEW = true;
    console.log(`>> Upgraded ${ContractName} at ${contract.address}`);
    return contract as any;
}

export async function contractAt<T extends Contract>(ContractName:string, address:string):Promise<T> {
    const hre = require('hardhat'); const {ethers} = hre;
    const contract = await ethers.getContractAt(ContractName, address);
    contract.NEW = false;
    contract.__upgradeProxy = (newContract=ContractName)=>upgradeProxy(contract.address, newContract);
    console.log('ContractAt:', ContractName, address);
    return contract as T;
}

export async function contractAtF<T extends { connect(...args:any[]):any}>(Contract:T, address:string): Promise<ReturnType<T['connect']>> {
    const hre = require('hardhat'); const {ethers} = hre;
    const signers = await ethers.getSigners();
    const contract = Contract.connect(address, signers[0]);
    contract.NEW = false;
    contract.__upgradeProxy = (newContract=Contract)=>upgradeProxyF(contract.address, newContract as any);
    console.log('ContractAtF:', contract.contractName, address);
    return contract;
}

export async function deployF<T extends { new(s?: Signer): any }>(
    Factory: T,
    args: DeployParams<T>,
    path?: string[],
): Promise<ReturnType<InstanceType<T>['deploy']>> {
    const factory = new Factory();
    return deploy(factory.contractName, args, path);
}

export async function deployProxyF<T extends { new(s?: Signer): any }>(
    Factory: T,
    args: InitParams<ContractT<T>>,
    path?: string[],
): Promise<ReturnType<InstanceType<T>['deploy']>> {
    const factory = new Factory();
    return deployProxy(factory.contractName, args, path);
}

export async function upgradeProxyF<T extends { new(s?: Signer): any}>(address:string, Factory:T): Promise<ReturnType<InstanceType<T>['deploy']>> {
    const factory = new Factory();
    return upgradeProxy(address, factory.contractName);
}

async function getProxyImplementation(address:string):Promise<string> {
    const hre = require('hardhat'); const {upgrades} = hre;
    const proxyAdmin = await upgrades.admin.getInstance();
    return proxyAdmin.callStatic.getProxyImplementation(address);
}

const CodeCache : {[address:string]:string} = {};
async function implCheck(address:string, newImplCode:string) {
    const hre = require('hardhat'); const {ethers} = hre;
    const impl = await getProxyImplementation(address);
    if (!CodeCache[impl]) {
        CodeCache[impl] = await ethers.provider.getCode(impl);
    }
    return newImplCode == CodeCache[impl];
}
