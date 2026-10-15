import { getWalletCtx } from './walletCtx'

import $axios from 'axios'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'
import { confirmTransaction } from './common.js'

const AbiCoder = ethers.AbiCoder;
const ADDRESS_PREFIX_REGEX = /^(41)/;
const ADDRESS_PREFIX = "41";
const estimateGas = async (param, from, contractAddress) => {
    try {
        const energyUsed = await getEnergyUsed(param, from, contractAddress);
        const chainParams = await tronWeb.trx.getChainParameters();
        const energyFee = chainParams.filter(item => item.key==='getEnergyFee')[0].value;
        return tronWeb.fromSun(energyUsed * energyFee);
    } catch (error) {
        throw error;
    }
}

const getEnergyUsed = async (param, from, contractAddress) => {
    try {
        let typesValues = [...param];
        let parameters = ''
        if (typesValues.length == 0)
            return parameters
        const abiCoder = new AbiCoder();
        let types = [];
        const values = [];
        for (let i = 0; i < typesValues.length; i++) {
            let {type, value} = typesValues[i];
            if (type == 'address')
                value = value.replace(ADDRESS_PREFIX_REGEX, '0x');
            else if (type == 'address[]')
                value = value.map(v => toHex(v).replace(ADDRESS_PREFIX_REGEX, '0x'));
            types.push(type);
            values.push(value);
        }
        parameters = abiCoder.encode(types, values).replace(/^(0x)/, '');
        // https://nile.trongrid.io/wallet/estimateenergy / /wallet/v1/trx/triggerconstantcontract
        let result = await $axios.post('/wallet/v1/trx/triggerconstantcontract', {
            owner_address: from,
            contract_address: contractAddress,
            function_selector: 'transfer(address,uint256)',
            parameter: parameters,
            visible: true
        });
        return result?.data?.data?.energy_used
    } catch (error) {
        throw error
    }
}
export const sendTRC20Token = (param) => {
    return new Promise(async (resolve,reject) => {
        const confirmTransactionToast = confirmTransaction(getWalletCtx().$i18n.t('order.confirm_transaction'));
        const options = {
            feeLimit: tronWeb.feeLimit || 1000000000,
            callValue: 0
        };
        try {
            let { from, to, amount, contractAddress, contractDecimals } = param;
            const amountRaw = new BigNumber(amount)
                .times(new BigNumber(10).pow(contractDecimals))
                .toFixed(0);
            let tronB = await tronWeb.trx.getBalance(from);
            let myEstimateGas = await estimateGas([
                {type: 'address', value: tronWeb.address.toHex(to)}, // to 
                {type: 'uint256', value: amountRaw}, // amount
            ], from, contractAddress);
            if (Number(tronWeb.fromSun(tronB, 0.000001)) < Number(myEstimateGas)) {
                throw { message: 'Not enough to pay for the estimate fees', code: -10000 }
            }
            const tx = await tronWeb.transactionBuilder.triggerSmartContract(
                contractAddress, 'transfer(address,uint256)', options,
                [{
                    type: 'address',
                    value: to
                }, {
                    type: 'uint256',
                    value: amountRaw
                }],
                tronWeb.address.toHex(from)
            );
            confirmTransactionToast.clear()
            const extendExpirationObj =  await tronWeb.transactionBuilder.extendExpiration(tx.transaction, 540);
            const signedTx = await tronWeb.trx.sign(extendExpirationObj);
            // const signedTx = await tronWeb.trx.sign(tx.transaction);
            const txid = await tronWeb.trx.sendRawTransaction(signedTx);
            
            resolve(txid)
            // { result: '', txid: '' }
            return txid;
        } catch (error) {
            confirmTransactionToast.clear()
            reject(error)
        }
    })
} 



