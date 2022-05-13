/* eslint-disable require-jsdoc */
import {BigNumber} from 'ethers';
import {ethers} from 'hardhat';

export async function latest(): Promise<BigNumber> {
    const block = await ethers.provider.getBlock('latest');
    return ethers.BigNumber.from(block.timestamp);
}

function sleep(ms:number) {
    console.log('sleep:', ms);
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function latestBlockNumber(): Promise<BigNumber> {
    const block = await ethers.provider.getBlock('latest');
    return ethers.BigNumber.from(block.number);
}

const devNet = ()=> [1337, 31337].includes(ethers.provider._network.chainId);

export async function advanceBlock() {
    if (devNet()) {
        await ethers.provider.send('evm_mine', []);
    }
}

export async function increaseBlockTime(duration: BigNumber) {
    if (duration.isNegative()) throw Error(`Cannot increase time by a negative amount (${duration})`);

    if (devNet()) {
        await ethers.provider.send('evm_increaseTime', [duration.toNumber()]);
        await advanceBlock();
    } else {
        await sleep((duration.toNumber() + 20) * 1000);
    }
}

export const duration = {
    seconds: function(val: BigNumber): BigNumber {
        return val;
    },
    minutes: function(val: BigNumber): BigNumber {
        return val.mul(this.seconds(ethers.BigNumber.from('60')));
    },
    hours: function(val: BigNumber): BigNumber {
        return val.mul(this.minutes(ethers.BigNumber.from('60')));
    },
    days: function(val: BigNumber): BigNumber {
        return val.mul(this.hours(ethers.BigNumber.from('24')));
    },
    weeks: function(val: BigNumber): BigNumber {
        return val.mul(this.days(ethers.BigNumber.from('7')));
    },
    years: function(val: BigNumber): BigNumber {
        return val.mul(this.days(ethers.BigNumber.from('365')));
    },
};

export async function advanceBlockTo(block: number) {
    let latestBlock = (await latestBlockNumber()).toNumber();

    if (block <= latestBlock) {
        throw new Error('input block exceeds current block');
    }

    while (block > latestBlock) {
        await advanceBlock();
        latestBlock++;
    }
}
