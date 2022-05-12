import {Wallet} from 'ethers';

/**
 * decrypt the keystore data and password to the crypto wallet
 * @param {Buffer} keystore
 * @param {string | undefined} password
 * @return {Wallet}
 */
export function fromKeystore(
    keystore: Buffer,
    password: string | undefined,
): Wallet {
    if (password === undefined) password = '';
    return Wallet.fromEncryptedJsonSync(keystore.toString(), password);
}

/**
 * encrypt private key with password to be keystore json file
 * @todo: verify type of private key
 * @param {string} privateKey: raw private key
 * @param {string} password: user password
 * @return {string}: keystore json data
 */
export async function toKeystore(
    privateKey: string,
    password: string,
): Promise<string> {
    if (password.length < 6) throw new Error('passwd too short');
    const wallet = new Wallet(privateKey);
    const data = await wallet.encrypt(password);
    return data;
}

