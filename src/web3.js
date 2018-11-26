import Web3 from 'web3';

export default function initializeWeb3() {
  let web3;
  if (typeof window !== 'undefined' && typeof window.web3 !== 'undefined') {
    web3 = new Web3(window.web3.currentProvider);
  } else {
    web3 = null; //or provide steemhunt's own web3 obj.
  }
  return web3;
}

