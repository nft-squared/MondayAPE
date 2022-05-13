// @todo: refactor this

const fs = require('fs');

// file: filename
// path: [] access path
// value: value to record
// rootKey: should be chainID, rootKey/...path
module.exports = (file, path, value, rootKey) => {
    const recordFile = process.cwd() + `/${file}`;
    const chainId = rootKey || require('hardhat').chainId;
    const record = fs.existsSync(recordFile) ? require(recordFile) : {};
    const chainName = require('hardhat').network.name;
    const chainRecord = record[chainId] || {__NAME__: chainName, __MAPPING__: {}};
    if (path && path.length > 0) {
        const parent = path.slice(0, -1).reduce((node, key) => node[key] = node[key] || {}, chainRecord);
        parent[path.slice(-1)[0]] = value;
        record[chainId] = chainRecord;
        if (file) {
            fs.writeFileSync(recordFile, JSON.stringify(record, undefined, '    '));
        }
    }
    chainRecord._path = (_path) => _path && _path.reduce((node, key) => node && node[key], chainRecord);
    return chainRecord;
};
