// @todo: refactor this

const {contractAt} = require('./deployer');
const record = require('./record');

module.exports = async function() {
    const Deployed = {...record(hre.Record)};
    const TypeMapping = Deployed['__MAPPING__'];
    delete Deployed['__MAPPING__'];
    const init = async (deployed, deployedType, contracts, path)=>{
        for (const [key, value] of Object.entries(deployed)) {
            const newPath = [...path, key];
            let newValue;
            if (typeof value == 'string') {
                if (!value.startsWith('0x')) {
                    newValue = value;
                } else {
                    const contractName = deployedType ? deployedType[key] || key : key;
                    newValue = await contractAt(contractName, value);
                }
            } else {
                newValue = await init(
                    deployed[key],
                    deployedType && deployedType[key],
                    {},
                    newPath,
                );
            }
            contracts[key] = newValue;
        }
        return contracts;
    };
    return init(Deployed, TypeMapping, {}, []);
};
