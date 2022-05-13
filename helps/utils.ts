import {Signer} from 'ethers';

/** Simple wallet is the simple version of wallet. Only have address field. */
export abstract class simpleWallet extends Signer {
    address!: string;
}
