import combine from 'utils/combine';
import getTransactions, { getTransactionsReducer } from './actions/getTransactions';
import setEthAddress, { setEthAddressReducer } from './actions/setEthAddress';
import withdraw, { withdrawReducer } from './actions/withdraw';

export const initialState = {
  balance: '',
  externalBalance: '',
  totalClaimed: 0.0,
  ethAddress: null,
  transactions: [],
  withdrawals: [],
  isLoading: false,
  isUpdating: false,
};

export const reducer = (state = initialState, action) => combine(
  [
    getTransactionsReducer,
    setEthAddressReducer,
    withdrawReducer,
  ],
  state,
  action,
);

// All sagas to be loaded
export default [
  getTransactions,
  setEthAddress,
  withdraw,
];
