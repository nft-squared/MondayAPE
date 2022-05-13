# MondayAPE
## Install
run `npm install` or `yarn`

## Test
run `yarn test`

## Deploy

### Hardhat local network
1. start hardhat node: `yarn enode`
2. open a new console run: `NETWORK=develop yarn console`
3. in console of step2, run:
```js
app = new hre.APP()
await app.deployAll()
{AuthAPE, MintPass, MockAPE, MockBAPE, MondayAPE} = app
```
### Other network
1. import a account: `yarn toKeystore xxx`
2. run: `NETWORK=XXX yarn console`, `NETWORK` can be "xxx_main" or "xxx_test", "xxx" is the chain name, "_main" means mainnet, "_test" means testnet. check it in `network.json`
3. deploy:
```js
app = new hre.APP()
await app.deployAll(BendDAO_APE, APE)
{AuthAPE, MintPass, MockAPE, MockBAPE: BAPE, MondayAPE: APE} = app
```

> If set the environment variable `NETENV`, it will auto record contract address into `record_${NETENV}.json` when deploy contracts. And would automatically create contract object and inject it into HRE objects, you can access via `hre.app` in hardhat console.