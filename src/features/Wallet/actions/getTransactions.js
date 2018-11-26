import { put, takeEvery } from 'redux-saga/effects';
import update from 'immutability-helper';
import api from 'utils/api';

/*--------- CONSTANTS ---------*/
const GET_TRANSACTION_BEGIN = 'GET_TRANSACTION_BEGIN';
const GET_TRANSACTION_SUCCESS = 'GET_TRANSACTION_SUCCESS';
const GET_TRANSACTION_FAILURE = 'GET_TRANSACTION_FAILURE';

/*--------- ACTIONS ---------*/
export function getTransactionsBegin() {
  return { type: GET_TRANSACTION_BEGIN };
}

function getTransactionsSuccess(result) {
  return { type: GET_TRANSACTION_SUCCESS, result };
}

function getTransactionsFailure(message) {
  return { type: GET_TRANSACTION_FAILURE, message };
}

/*--------- REDUCER ---------*/
export function getTransactionsReducer(state, action) {
  switch (action.type) {
    case GET_TRANSACTION_BEGIN:
      return update(state, {
        isLoading: { $set: true },
      });
    case GET_TRANSACTION_SUCCESS:
      const { result } = action;

      return update(state, {
        balance: { $set: result.balance },
        externalBalance: { $set: result.external_balance },
        ethAddress: { $set: result.eth_address },
        transactions: { $set: result.transactions },
        withdrawals: { $set: result.withdrawals },
        isLoading: { $set: false },
      });
    // Better leave this loading forever instead showing 0 balance
    case GET_TRANSACTION_FAILURE:
      return update(state, {
        isLoading: { $set: false },
      });
    default:
      return state;
  }
}

/*--------- SAGAS ---------*/
function* getTransactions() {
  try {
    const result = yield api.get(`/hunt_transactions.json`, null, true);
    yield put(getTransactionsSuccess(result));
  } catch(e) {
    yield put(getTransactionsFailure(e.message));
  }
}

export default function* getTransactionsManager() {
  yield takeEvery(GET_TRANSACTION_BEGIN, getTransactions);
}
