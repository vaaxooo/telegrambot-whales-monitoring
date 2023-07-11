const Web3 = require('web3');

// Подключаемся к узлу Ethereum
const web3 = new Web3(process.env.WEB3_PROVIDER_URL);

module.exports = web3;