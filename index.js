require('dotenv-flow').config()
const axios = require('axios')
const cron = require('node-cron')
const Telegram = require('./Telegram')
const { crypto_wallets } = require('./wallets.json')

/**
 * The sleep function in JavaScript pauses the execution of code for a specified number of seconds.
 * @param seconds - The "seconds" parameter is the number of seconds that the function should wait
 * before resolving the promise.
 * @returns a Promise object.
 */
function sleep(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}  

/**
 * The function converts a token value from its raw form to a normalized form with 6 decimal places.
 * @param tokenValue - The `tokenValue` parameter represents the value of a token.
 * @returns a string representation of the normalized value of the token, with a fixed precision of 6
 * decimal places.
 */
function convertTokenValue(tokenValue) {
    const normalizedValue = parseFloat(+tokenValue) / Math.pow(10, 18);
    return (+normalizedValue).toFixed(6);
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
                let timeDifference = currentDate - +token.timeStamp;
                let timeDifferenceMinutes = timeDifference / 60;                
                if(timeDifferenceMinutes < 5) {
                    await sleep(2)
                    const { tokenSymbol, tokenName, value, from, to } = token

                    let message = `🐳 *Кошелек:* [${wallet}](https://etherscan.io/address/${wallet})\n`
                    message += `▪️ *Транзакция:* [${token.hash}](https://etherscan.io/tx/${token.hash})\n\n`
                    message += `▪️ *Токен:* ${tokenName}\n`
                    message += `▪️ *Количество:* ${convertTokenValue(+value)} ${tokenSymbol}\n`
                    
                    if(message) {
                        Telegram.sendMessage(process.env.TELEGRAM_GROUP_ID, message, { parse_mode: 'Markdown' })
                    }
                }
            }
        }
    }
    console.log('Done!')
}

checkTokens()

// cron.schedule('*/5 * * * *', checkTokens)