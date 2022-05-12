import '@typechain/hardhat';
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-waffle';
import '@openzeppelin/hardhat-upgrades';
import 'hardhat-deploy';
import 'solidity-coverage';
import {extendEnvironment, task} from 'hardhat/config';
import {Wallet} from 'ethers';

import {testnet, mainnet} from './networks.json';
import {fromKeystore, toKeystore} from './wallet';
import fs from 'fs';

const KeystoreDir = './keystore';
const prikeys = () => {
    if (fs.existsSync(KeystoreDir) && process.env.PASSWD) {
        const keystoreFiles = fs.readdirSync(KeystoreDir);
        return keystoreFiles
            .map((file) => fs.readFileSync(`${KeystoreDir}/${file}`))
            .map((keystoreStr) =>
                fromKeystore(keystoreStr, process.env.PASSWD),
            );
    }
    return [];
};

extendEnvironment(async (hre: any) => {
    if (process.argv.includes('compile')) return; // skip compile
    // getter setter?
    if (!fs.existsSync(hre.config.typechain.outDir)) return;
    const {App} = require('./helps/app'); // reference compilation result
    hre.APP = App;
    const netenv = process.env.NETENV;
    if (!netenv) {
        console.log('export NETENV=XXX // local,mainnet,testnet');
        return;
    }
    if (hre.hardhatArguments.network == undefined) {
        return;
    }
    let wait = (_:any)=>{};
    hre.wait = new Promise((resolve)=>{
        if (hre.app) resolve(hre.app);
        wait = resolve;
    });
    hre.netenv = netenv.toLowerCase();
    hre.Record = `record_${hre.netenv}.json`;
    // hre.Chains = "chains_testnet.json";
    hre.Chains = `chains_${hre.netenv}.json`;
    hre.chainId = await hre.getChainId();
    {
        console.log(
            `---------------------using NETWORK ${hre.network.name.toUpperCase()}`,
        );
        hre.AppFile = `APP_${hre.network.name}.ts`;
        // reference compilation result
        const contractLoad = require('./helps/load.js');
        hre.app = await contractLoad();
        wait(hre.app);
    }
});

task('toKeystore', 'encrypt private key and save to keystore')
    .addPositionalParam('prikey', 'private key')
    .addPositionalParam('passwd', 'password to encrypto')
    .setAction(async function({prikey, passwd}) {
        const jsonKeystore = await toKeystore(prikey, passwd);
        const {address} = JSON.parse(jsonKeystore);
        if (!fs.existsSync(KeystoreDir)) {
            fs.mkdirSync(KeystoreDir, {recursive: true});
        }
        const KeystoreFile = `${KeystoreDir}/${address}.keystore.json`;
        fs.writeFileSync(KeystoreFile, jsonKeystore);
        console.log(`saved in ${KeystoreFile}`);
    });

task('fromKeystore', 'decrypt a keystore file')
    .addPositionalParam('keyfile', 'keystore file path')
    .addPositionalParam('passwd', 'password to decrypto')
    .setAction(async function({keyfile, passwd}) {
        const jsonKeystore = fs.readFileSync(keyfile);
        const wallet = fromKeystore(jsonKeystore, passwd);
        console.log('prikey:', wallet.privateKey);
    });

/**
 * process the network information.
 * @param {any} network: network network endpoints and chain ID for each chains
 * @param {string} suffix: suffix network specifier
 * @param {Wallet[]} wallets: wallets
 * @return {any}: sorted network
 */
function networks(network: any, suffix: string, wallets: Wallet[]) {
    const keys = Object.keys(network);
    const nets = {} as any;
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const chain = `${key}_${suffix}`;
        const net = network[key];
        nets[chain] = {
            ...net,
            accounts: wallets.map(wallet=>wallet.privateKey),
        };
    }
    return nets;
}

module.exports = {
    defaultNetwork: 'hardhat',
    networks: {
        hardhat: {
            chainId: 31337,
            gas: 12000000,
            blockGasLimit: 0x1fffffffffffff,
            allowUnlimitedContractSize: true,
            timeout: 1800000,
            accounts: {
                mnemonic: 'test test test test test test test test test test test junk',
                initialIndex: 0,
                count: 20,
                path: 'm/44\'/60\'/0\'/0',
                accountsBalance: '10000000000000000000000000',
            },
        },
        develop: {
            url: 'http://localhost:8545',
        },
        ...networks(mainnet, 'main', prikeys()),
        ...networks(testnet, 'test', prikeys()),
    },
    solidity: {
        version: '0.8.8',
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
            evmVersion: 'istanbul',
            outputSelection: {
                '*': {
                    '': ['ast'],
                    '*': [
                        'evm.bytecode.object',
                        'evm.deployedBytecode.object',
                        'abi',
                        'evm.bytecode.sourceMap',
                        'evm.deployedBytecode.sourceMap',
                        'metadata',
                    ],
                },
            },
        },
    },
    paths: {
        sources: './contracts',
        tests: './test',
        cache: './cache',
        artifacts: './artifacts',
    },
    typechain: {
        outDir: './typechain',
        target: process.env.TYPECHAIN_TARGET || 'ethers-v5',
    },
};
