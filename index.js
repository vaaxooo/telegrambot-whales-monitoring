require('dotenv-flow').config()
const axios = require('axios')
const cron = require('node-cron')
const Telegram = require('./Telegram')
const { crypto_wallets } = require('./wallets.json')

function sleep(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}  

function convertTokenValue(tokenValue, decimalPlaces) {
    const precision = Math.pow(10, decimalPlaces);
    const convertedValue = tokenValue / precision;
    return convertedValue;
  }
  

const checkTokens = async () => {
    for (const wallet of crypto_wallets) {
        await sleep(1)
        const { data: res } = await axios.get(`https://api.etherscan.io/api?module=account&action=tokentx&address=${wallet}&apikey=${process.env.ETHERSCAN_API_KEY}&sort=desc`)
        if(+res.status === 1) {
            const { result: tokens } = res
            const currentDate = Math.floor(new Date().getTime() / 1000);
            let tokensList = tokens.filter(token => token.to === wallet)
            for (let token of tokensList) {
                await sleep(4)
                let timeDifference = currentDate - +token.timeStamp;
                let timeDifferenceMinutes = timeDifference / 60;                


                if(timeDifferenceMinutes < 5) {
                    const { tokenSymbol, tokenName, value, from, to } = token

                    let message = `🐳 *Кошелек:* [${wallet}](https://etherscan.io/address/${wallet})\n`
                    message += `▪️ *Транзакция:* [${token.hash}](https://etherscan.io/tx/${token.hash})\n\n`
                    message += `▪️ *Токен:* ${tokenName} (${tokenSymbol})\n`
                    message += `▪️ *Количество:* ${value} ${tokenSymbol}\n`
                    
                    if(message) {
                        Telegram.sendMessage(process.env.TELEGRAM_GROUP_ID, message, { parse_mode: 'Markdown' })
                    }
                }
            }
        }
    }
    console.log('Done!')
}

cron.schedule('*/5 * * * *', checkTokens)