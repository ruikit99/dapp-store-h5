import Web3 from 'web3';
import { getWalletCtx } from './walletCtx';
import BigNumber from "bignumber.js";
import $axios from 'axios'
import { encode } from 'bs58';
import { ConnectWalletToast } from './common.js';
import abiJSON from './contractsAbiJson.json';
const iconBSC = '/images/icon-bsc.svg'
const iconETH = '/images/icon-eth.svg'
const iconARBITRUM = '/images/icon-arbitrum.svg'
const iconMATIC = '/images/icon-polygon.svg'

const iconAVAX = '/images/icon-AVAX.png'
const iconOETH = '/images/icon-OETH.png'
export const netWorkList = [
    { title: 'Avalanche C-Chain', label: 'AVAXC', value: '0xa86a', icon: iconAVAX },
    { title: 'BNB Chain', label: 'BSC', value: '0x38', icon: iconBSC },
    { title: 'Ethereum', label: 'ETH', value: '0x1', icon: iconETH },
    { title: 'Arbitrum One', label: 'ARBITRUM', value: '0xa4b1', icon: iconARBITRUM },
    { title: 'Optimism', label: 'Optimism', value: '0xa', icon: iconOETH },
    { title: 'Polygon', label: 'MATIC', value: '0x89', icon: iconMATIC },
    // { title: 'Solnan', label: 'SOLANA', value: -99, icon: iconMATIC },
    // { title: 'Tron', label: 'TRON', value: -98, icon: iconMATIC },
    // { title: 'Kovan', label: 'Kovan', value: '0x2a' },
    // { title: 'Faucet',label: 'Faucet', value: '0x3' },
];
export function onConnect(w) {
    const win = w || window;
    const connectToast = ConnectWalletToast();
    const ethereumAddress = win?.ethereum?.address || win?.ethereum?.selectedAddress
    if (win.solana && typeof win.solana !== 'undefined' && `${win.solana?.address}`.toLocaleLowerCase() === `${ethereumAddress}`.toLocaleLowerCase()) {
        return new Promise(async (resolve, reject) => {
            resolve({
                name: 'SOLANA',
                isConnected: win?.solana?.isConnected,
                provider() { return win.solana }
            })
        }).then(async result => {
            let connect = await result.provider().connect();
            result = Object.assign({}, result, { currentAccount: connect.address, chainId: -99});
            const cookieWalletAddress = getWalletCtx().$cookiz.get('wallet-address')
            if (cookieWalletAddress !== result.currentAccount) {
                getWalletCtx().$cookiz.remove('session_id');
            }
            getWalletCtx().$cookiz.set('wallet-address', result.currentAccount);
            return Object.assign({}, result, { ...connect, isConnected: win?.solana?.isConnected});
        }).then(async res => {
            const {currentAccount} = res;
            const sessionId = getWalletCtx().$cookiz.get('session_id');
            if (!sessionId) {
                const result = await getWalletCtx().$Api.getSignMsg({ 
                    signType: 1, 
                    chainId: 'sol', 
                    walletAddress: currentAccount });
                const { nonce, msg, serverTime } = result;
                connectToast.clear();
                return solanaPersonalSign(res.provider(), { msg}).then(sign => {
                    const { signature } = sign;
                    if (signature === '0x') {
                        throw {message: getWalletCtx().$i18n.t('home.user_denied_sign'), code: 4001}
                    }
                    getWalletCtx().$myLoading.showLoading();
                    return getWalletCtx().$Api.authSign({ 
                        signType: 1, 
                        chainId: 'sol', 
                        walletAddress: currentAccount, 
                        signature: `0x${Buffer.from(signature).toString('hex')}`, 
                        serverTime: serverTime, 
                        message: msg, 
                        nonce: nonce 
                    }).then(r => {
                        const { session_id, expire_time } = r;
                        getWalletCtx().$cookiz.set('session_id', session_id, { path: '/', maxAge: expire_time || 60*60*24 });
                        window.sessionStorage.setItem('session_id', session_id)
                        getWalletCtx().$store.commit('setSessionId', session_id)
                        getWalletCtx().$sigin.closeSigin();
                        return Object.assign({}, res, { netIsSupport: true, time: +new Date() });
                    })
                }).catch(error => {
                    if (typeof window !== 'undefined') {
                        setTimeout(() => {
                            getWalletCtx().$store.commit('setWallet', {})
                            getWalletCtx().$cookiz.set('connect', false);
                            window.sessionStorage.setItem('isConnect', false)
                            getWalletCtx().$store.commit('setIsConnect', false)
                        }, 0)
                    }
                    if (Object.prototype.toString.call(error) === '[object Object]') {
                        const { message, code } = error;
                        
                        getWalletCtx().$tips.showError({ show: true, text: message, timing: 3000 })
                    } else if(Object.prototype.toString.call(error) === '[object String]') {
                        getWalletCtx().$tips.showError({ show: true, text: error, timing: 3000 })
                    }
                    throw error
                }).finally(() => {
                    getWalletCtx().$myLoading.closeLoading();
                });
            } else {
                connectToast.clear();
                return Object.assign({}, res, { netIsSupport: true, time: +new Date() });
            }
        }).catch((error) => {
            connectToast.clear();
            throw error
        })
    } else if (window.tronWeb && typeof window.tronWeb !== 'undefined' && `${win.tronWeb?.defaultAddress?.base58}`.toLocaleLowerCase() === `${ethereumAddress}`.toLocaleLowerCase()) {
        return new Promise(async (resolve, reject) => {
            resolve({
                name: 'TRON',
                provider() { return win.tronWeb }
            })
        }).then(result => {
            if (!(window.tronWeb.trx && ('signMessageV2' in window.tronWeb.trx))) {
                connectToast.clear();
                throw { code: -9000, message: 'The current App version does not support Tron network, Please upgrade the App to the latest version' }
            } else {
                return result
            }
        }).then(async result => {
            let { defaultAddress, ready } = await result.provider();
            if (Object.prototype.toString.call(ready) === '[object Undefined]') {
                if (defaultAddress&&defaultAddress.base58) {
                    if (Object.prototype.toString.call(defaultAddress.base58) === '[object String]') {
                        result = Object.assign({}, result, { isConnected: true, currentAccount: defaultAddress.base58, chainId: -98});
                    }
                }
            } else {
                // chainId -98 tron
                result = Object.assign({}, result, { isConnected: ready, currentAccount: defaultAddress.base58, chainId: -98});
            }
            const cookieWalletAddress = getWalletCtx().$cookiz.get('wallet-address')
            if (cookieWalletAddress !== result.currentAccount) {
                getWalletCtx().$cookiz.remove('session_id');
            }
            getWalletCtx().$cookiz.set('wallet-address', result.currentAccount);
            return Object.assign({}, result);
        }).then(async res => {
            const {currentAccount} = res;
            const sessionId = getWalletCtx().$cookiz.get('session_id');
            if (!sessionId) {
                const result = await getWalletCtx().$Api.getSignMsg({ 
                    signType: 1, 
                    chainId: 'tron', 
                    walletAddress: currentAccount });
                const { nonce, msg, serverTime } = result;
                connectToast.clear();
                return tronPersonalSign(res.provider(), { msg}).then(signature => {
                    if (signature === '0x') {
                        throw {message: getWalletCtx().$i18n.t('home.user_denied_sign'), code: 4001}
                    }
                    getWalletCtx().$myLoading.showLoading();
                    return getWalletCtx().$Api.authSign({ 
                        signType: 1, 
                        chainId: 'tron', 
                        walletAddress: currentAccount, 
                        signature: signature, 
                        serverTime: serverTime, 
                        message: msg, 
                        nonce: nonce 
                    }).then(r => {
                        const { session_id, expire_time } = r;
                        getWalletCtx().$cookiz.set('session_id', session_id, { path: '/', maxAge: expire_time || 60*60*24 });
                        window.sessionStorage.setItem('session_id', session_id)
                        getWalletCtx().$store.commit('setSessionId', session_id)
                        getWalletCtx().$sigin.closeSigin();
                        return Object.assign({}, res, { netIsSupport: true, time: +new Date() });
                    })
                }).catch(error => {
                    if (typeof window !== 'undefined') {
                        setTimeout(() => {
                            getWalletCtx().$store.commit('setWallet', {})
                            getWalletCtx().$cookiz.set('connect', false);
                            window.sessionStorage.setItem('isConnect', false)
                            getWalletCtx().$store.commit('setIsConnect', false)
                        }, 0)
                    }
                    if (Object.prototype.toString.call(error) === '[object Object]') {
                        const { message, code } = error;
                        getWalletCtx().$tips.showError({ show: true, text: message, timing: 3000 })
                    } else if(Object.prototype.toString.call(error) === '[object String]') {
                        getWalletCtx().$tips.showError({ show: true, text: error, timing: 3000 })
                    }
                    throw error
                }).finally(() => {
                    getWalletCtx().$myLoading.closeLoading();
                });
            } else {
                connectToast.clear();
                return Object.assign({}, res, { netIsSupport: true, time: +new Date() });
            }
        }).catch((error) => {
            connectToast.clear();
            throw error
        })
    } 
    else {
        removeChainChanged(win);
        removeAccountsChanged(win);
        return new Promise(async function(resolve, reject) {
            if (win.ethereum && typeof win.ethereum !== 'undefined') {
                resolve({
                    name: 'MetaMask',
                    isConnected: win?.ethereum?.isConnected(),
                    provider() { return win.ethereum }
                })
            } else {
                reject(new Error(`Non-Ethereum browser detected or Unsupported non-evm networks.`));
            }
        }).then(async result => {
            let getAccount1 = a => { return getAccounts(a); };
            let getAccount2 = async res => {
                onChainChanged(res.provider());
                onAccountsChanged(res.provider());
                const { chainId, currentAccount } = res;
                const sessionId = getWalletCtx().$cookiz.get('session_id');
                if (!sessionId) {
                    const result = await getWalletCtx().$Api.getSignMsg({ signType: 1, chainId: chainId, walletAddress: currentAccount });
                    const { nonce, msg, serverTime } = result;
                    return personalSign(res.provider(), {currentAccount, msg}).then(signature => {
                        if (signature?.isCancel) {
                            throw { code: 4001, message: getWalletCtx().$i18n.t('common.cancelled_by_user') }
                        }
                        if (signature === '0x') {
                            throw {message: getWalletCtx().$i18n.t('home.user_denied_sign'), code: 4001}
                        }
                        return getWalletCtx().$Api.authSign({ 
                            signType: 1, 
                            chainId: chainId, 
                            walletAddress: currentAccount, 
                            signature: signature, 
                            serverTime: serverTime, 
                            message: msg, 
                            nonce: nonce 
                        }).then(r => {
                            const { session_id, expire_time } = r;
                            getWalletCtx().$cookiz.set('session_id', session_id, { path: '/', maxAge: expire_time || 60*60*24 });
                            window.sessionStorage.setItem('session_id', session_id)
                            getWalletCtx().$store.commit('setSessionId', session_id)
                            getWalletCtx().$sigin.closeSigin();
                            return res;
                        })
                    }).catch(error => {
                        connectToast.clear();
                        if (typeof window !== 'undefined') {
                            setTimeout(() => {
                                getWalletCtx().$store.commit('setWallet', {})
                                getWalletCtx().$cookiz.set('connect', false);
                                window.sessionStorage.setItem('isConnect', false)
                                getWalletCtx().$store.commit('setIsConnect', false)
                            }, 0)
                        }
                        if (Object.prototype.toString.call(error) === '[object Object]') {
                            const { message, code } = error;
                            getWalletCtx().$tips.showError({ show: true, text: message, timing: 3000 })
                        } else if(Object.prototype.toString.call(error) === '[object String]') {
                            getWalletCtx().$tips.showError({ show: true, text: error, timing: 3000 })
                        }
                        throw error
                    }).finally(() => {
                        connectToast.clear();
                    });
                } else {
                    connectToast.clear();
                    return res;
                }
            }
            let account1Value = await getAccount1(result);
            let account2Value = await getAccount2(account1Value);
            if (getWalletCtx().$store.state.netAssign) {
                let index = netWorkList.findIndex(item => `${item.value}`.toLocaleLowerCase() === `${getWalletCtx().$store.state.netAssign}`.toLocaleLowerCase());
                if (index > -1) {
                    await switchChain(window.ethereum, getWalletCtx().$store.state.netAssign)
                }
            }
            return account2Value;
        }).then(res => {
            const { chainId } = res;
            let index = netWorkList.findIndex(item => item.value === chainId);
            if (index === -1) {
                getWalletCtx().$netErrTips.showNetErrTips(getWalletCtx().$i18n.t('home.current_network_is_unsupported'));
                getWalletCtx().$store.commit('setNetValue', {})
            } else if (index > -1) {
                getWalletCtx().$store.commit('setNetValue', netWorkList[index])
            }
            return Object.assign({}, res, { netIsSupport: index > -1, time: +new Date() });
        }).catch((error) => {
            connectToast.clear();
            throw error
        });
    }
    
}
export const getConnect = () => {
    return new Promise(async function(resolve, reject) {
        if (window.ethereum && typeof window.ethereum !== 'undefined') {
            resolve({
                name: 'MetaMask',
                isConnected: window?.ethereum?.isConnected(),
                provider() { return window.ethereum }
            })
        } else {
            reject(new Error(`Non-Ethereum browser detected.`));
        }
    }).then(result => {
        return getAccounts(result);
    })
}
const toPersonalSignHexMessage = (msg) => {
    const web3 = new Web3();
    return web3.utils.isHexStrict(msg) ? msg : web3.utils.utf8ToHex(msg);
}
export const personalSign = (provider, param) => {
    return provider.request({ method: "personal_sign", params: [param.msg, param.currentAccount]});
}
export const tronPersonalSign = async (provider, param) => {
    return await provider.trx.signMessageV2(param.msg);
}
export const solanaPersonalSign = async (provider, param) => {
    return await provider.signMessage(new TextEncoder().encode(param.msg));
}
export const onChainChanged = provider => {
    window.localStorage.setItem('chainChanged', true)
    provider.on('chainChanged', chainChangedCB);
}
export const onAccountsChanged = async provider => {
    await provider.on('accountsChanged', result => {
        if ((result && result[0]) || (result && result[0] === undefined)) {
            getWalletCtx().$store.commit('setWallet', {});
            getWalletCtx().$cookiz.set('connect', false);
            getWalletCtx().$cookiz.remove('session_id');
            window.sessionStorage.setItem('isConnect', false)
            getWalletCtx().$store.commit('setIsConnect', false)
        }
        reload()
    });
}
function removeAccountsChanged(w) {
    const win = w || window;
    if (win.ethereum && win.ethereum.removeListener) {
        win.ethereum.removeListener('accountsChanged', reload)
    }
    
}
function removeChainChanged(w) {
    const win = w || window;
    if (win.ethereum&&win.ethereum.removeListener) {
        win.ethereum.removeListener('chainChanged', chainChangedCB)
    }
}
function reload() {
    window.location.reload()
}
export const switchChain = (provider, chainId) => {
    return new Promise(async function(resolve, reject) {
        try {
          await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId }],
          });
          resolve()
        } catch (error) {
          // This error code indicates that the chain has not been added to MetaMask.
          reject(error)
        }
      })
}
export let getAccounts = (result) => {
    return result.provider().request({ method: 'eth_requestAccounts' }).then(res => { 
      result = Object.assign({}, result, { currentAccount: res[0], ...res},);
      const cookieWalletAddress = getWalletCtx().$cookiz.get('wallet-address')
      if (cookieWalletAddress !== result.currentAccount) {
        getWalletCtx().$cookiz.remove('session_id');
      }
      getWalletCtx().$cookiz.set('wallet-address', result.currentAccount);
      getWalletCtx().$store.commit('setWalletAddress', result.currentAccount)
      window.sessionStorage.setItem('walletAddress', result.currentAccount)
      return result;
    })
    .then(result => {
        return result.provider().request({ method: 'eth_chainId' }).then(async res => {
            const chainId = await toHex(res);
            result = Object.assign({}, result, {chainId: chainId});
            return result
        })
    })
    .then(result => {
      return result.provider().request({ method: 'eth_accounts' }).then(res => {
       return Object.assign({}, result, { currentAccount: res&&res.length === 0 ? null : res[0] ? res[0] : result['currentAccount'] ? result['currentAccount'] : null })
      })
    })
  }

export const toHex = async (param) => {
    const web3 = new Web3();
    return await web3.utils.isHexStrict(param) ? param : await web3.utils.toHex(param)
}
const toDecimalChainId = (chainId) => {
    if (chainId == null || chainId === '') {
        return chainId
    }
    const web3 = new Web3();
    if (typeof chainId === 'string' && web3.utils.isHexStrict(chainId)) {
        return String(web3.utils.hexToNumber(chainId))
    }
    return String(chainId)
}
const chainId2Type =  {
    "1": '02',
    "01": '02',
    "56": "16",
    "137": "23",
    "42161": '37'
};
const getRandom = () => { return Number.parseInt((Math.random() * 1000000)) }

export let rawTransaction = async (data) => {
    
    let { from, to, amount, contractAddress, contractDecimals, nativeToken } = data;
    const web3 = new Web3(window.ethereum);
    try {
        const safepalProvider = window.safepalProvider || window.ethereum;
        let chainId = toDecimalChainId(safepalProvider.chainId);
        let rpc = safepalProvider.rpc?.rpcUrl || window.ethereum?.rpc?.rpcUrl;
        const getByAxiosRpcCall = (method, param, rpcurl, chain_id, cb) => {
            return $axios.post('/wallet/v1/proxy/rpc_call', { 
                url: rpcurl,
                type: chainId2Type[chain_id],
                chain_id: chain_id,
                params: {
                    "id": getRandom(),
                    "jsonrpc":"2.0",
                    "method": method,
                    "params": param
                }
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(async res => {
                const { data: { result, error } } = res;
                if (error) {
                    throw error
                } else {
                    return await web3.utils.hexToNumber(result);
                }
            })
        }
        const sendTxGasPrices = async () => {
            const BN = web3.utils.BN;
            // const res = await web3.eth.getGasPrice()
            const res = await getByAxiosRpcCall('eth_gasPrice', [], rpc, chainId )
            // return BN(res*1.5).toString(16)
            return await toHex(BN(res*1.5))
        };
        // const getTransactionCount = async from => await toHex(await web3.eth.getTransactionCount(from))
        const getTransactionCount = async from => await toHex(await getByAxiosRpcCall('eth_getTransactionCount', [from, "latest"], rpc, chainId))
        const getEstimateGas = async param => {
            const BN = web3.utils.BN;
            // const res = await web3.eth.estimateGas(param);
            const res = await getByAxiosRpcCall('eth_estimateGas', [param], rpc, chainId);
            return await toHex(BN(res*1.2))
        };
        const contract = new web3.eth.Contract(abiJSON, contractAddress, {from: from})
        let result = {};
        if (nativeToken) {
            result = {
                // 'data': '0x00',
                'from': from,
                // 'gasPrice': web3.utils.toHex(20 * 1e9),
                // 'gasLimit': '0x5208',
                'gas': '0x5208',
                'to': to,
                'value': web3.utils.numberToHex(web3.utils.toWei(amount, 'ether')),
            }
        } else {
            let amountBn = new BigNumber(amount)
            let deBn = new BigNumber(Math.pow(10, contractDecimals));
            result = {
                'data': contract.methods.transfer(to, amountBn.times(deBn).toString()).encodeABI(),
                'from': from,
                'gasLimit': "0x5208",
                'gas': await getEstimateGas({ 
                    to: contractAddress, 
                    data: contract.methods.transfer(to, amountBn.times(deBn).toString()).encodeABI(),
                    from: from
                }),
                'gasPrice': await sendTxGasPrices(),
                'nonce': await getTransactionCount(from),
                'to': contractAddress,
                // 'value': "0x00"
            }
        }
        return result
    } catch (error) {
        throw error
    }
}
function toSetNetValue(chainId) {
    let index = netWorkList.findIndex(item => item.value === chainId);
    if (index === -1) {
        getWalletCtx().$netErrTips.showNetErrTips(getWalletCtx().$i18n.t('home.current_network_is_unsupported'));
        getWalletCtx().$store.commit('setNetValue', {})
    } else if (index > -1) {
        getWalletCtx().$store.commit('setNetValue', netWorkList[index])
    }
}
function chainChangedCB () {
    window.ethereum.request({
        method: 'eth_chainId',
        "params":[],
        "id":1,
        "jsonrpc":"2.0"
    }).then(chainId => {
        let wallet = getWalletCtx().$store.state.wallet
        getWalletCtx().$store.commit('setWallet', wallet ? { ...wallet, chainId: `${chainId}` } : {});
        toSetNetValue(chainId);
    });
}
