import { getWalletCtx } from './walletCtx'
import {
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  getAccount
} from '@solana/spl-token';
import {
  PublicKey,
  Transaction,
  Connection,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import BigNumber from 'bignumber.js'
import * as bs58 from "bs58";
import $axios from 'axios'
import Qs from 'qs';
import { confirmTransaction } from './common.js'

export const SendSolanaSplTokens = async (param) => {
  // https://github.com/yihau/solana-web3-demo/tree/main/tour
  // Connect to cluster
  let { from, to, contractAddress, amount, contractDecimals } = param;
  const rpc_proxy = 'xxxx'
  const connection = new Connection(rpc_proxy);
  // from wallet
  const fromPubkey = new PublicKey(from);
  const solanaAxiosSendTx = (data) => {
    return $axios.post('/wallet/v1/solana/sendtx', 
      Qs.stringify({...data}), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }}).then(res => {
      const { data: { data, code, msg} } = res;
      if (code !== 0) {
        throw {
          code,
          msg
        }
      } else {
        return data;
      }
    })
  }
  return new Promise( async (resolve,reject) => {
    try {
      const confirmTransactionToast = confirmTransaction(getWalletCtx().$i18n.t('order.confirm_transaction'));
      const mintToken = new PublicKey(contractAddress);
      const recipientAddress = new PublicKey(to);
      const transactionInstructions = [];
      const associatedTokenFrom = await getAssociatedTokenAddress(
        mintToken,
        fromPubkey
      );
      const fromAccount = await getAccount(connection, associatedTokenFrom);
      const associatedTokenTo = await getAssociatedTokenAddress(
        mintToken,
        recipientAddress
      );
      if (!(await connection.getAccountInfo(associatedTokenTo))) {
        transactionInstructions.push(
          createAssociatedTokenAccountInstruction(
            fromPubkey, // Payer of the initialization fees
            associatedTokenTo, // New associated token account
            recipientAddress, // Owner of the new account
            mintToken // Token mint account
          )
        );
      }
      const amountRaw = new BigNumber(amount)
        .times(new BigNumber(10).pow(contractDecimals))
        .toFixed(0)
      transactionInstructions.push(
        createTransferInstruction(
          fromAccount.address, // source
          associatedTokenTo, // dest
          fromPubkey,
          BigInt(amountRaw)
        )
      );
      const transaction = new Transaction().add(...transactionInstructions);
      const blockHash = await connection.getLatestBlockhash();
      transaction.feePayer = fromPubkey;
      transaction.recentBlockhash = blockHash.blockhash;
      transaction.lastValidBlockHeight = blockHash.lastValidBlockHeight;
      let fee = await connection.getFeeForMessage(
        transaction.compileMessage(),
        'confirmed',
      );
      const balance = await connection.getBalance(fromPubkey)
      if (balance < fee.value) {
        throw { message: 'Payer is not enough to pay fees', code: -10000 }
      }
      confirmTransactionToast.clear();
      let tx = await window.solana.signTransaction(transaction);
      getWalletCtx().$myLoading.showLoading();
      /**
       * Supports only USDC on Solana.
       */
      solanaAxiosSendTx({
        hex: bs58.encode(tx.serialize()),
        txinfo: `26:USDC;${to};${from};${amount};0;1:transfer`
      }).then(res => {
        resolve(res)
        return res;
      }).catch(error => {
        if (Object.prototype.toString.call(error) === '[object String]') {
          throw { message: error, code: 4001 }
        } else {
          throw { ...error, code: 4001 };
        }
      }).finally(() => {
        getWalletCtx().$myLoading.closeLoading();
      });
    } catch (error) {
      reject(error)
    }
  })
}
