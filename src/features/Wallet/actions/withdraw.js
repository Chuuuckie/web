import { put, takeLatest } from 'redux-saga/effects';
import update from 'immutability-helper';
import { notification } from 'antd';
import api from 'utils/api';
import { extractErrorMessage } from 'utils/errorMessage';

/*--------- CONSTANTS ---------*/
const WITHDRAW_BEGIN = 'WITHDRAW_BEGIN';
const WITHDRAW_SUCCESS = 'WITHDRAW_SUCCESS';
const WITHDRAW_FAILURE = 'WITHDRAW_FAILURE';

/*--------- ACTIONS ---------*/
export function withdrawBegin(amount) {
  return { type: WITHDRAW_BEGIN, amount };
}

function withdrawSuccess(result) {
  return { type: WITHDRAW_SUCCESS, result };
}

function withdrawFailure(message) {
  return { type: WITHDRAW_FAILURE, message };
}

/*--------- REDUCER ---------*/
export function withdrawReducer(state, action) {
  switch (action.type) {
    case WITHDRAW_BEGIN:
      return update(state, {
        isLoading: { $set: true },
      });
    case WITHDRAW_SUCCESS:
      const { result } = action;

      return update(state, {
        isLoading: { $set: false },
        balance: { $set: result.balance },
        externalBalance: { $set: result.external_balance },
        withdrawals: { $unshift: [result.withdrawal] }, // put on top
      });
    case WITHDRAW_FAILURE:
      return update(state, {
        isLoading: { $set: false },
      });
    default:
      return state;
  }
}

/*--------- SAGAS ---------*/
function* withdraw({ amount }) {
  try {
    const result = yield api.post(`/erc_transactions.json`, { amount: amount }, true);
    yield put(withdrawSuccess(result));
  } catch(e) {
    yield notification['error']({ message: extractErrorMessage(e) });
    yield put(withdrawFailure(e.message));
  }
}

export default function* withdrawManager() {
  yield takeLatest(WITHDRAW_BEGIN, withdraw);
}
