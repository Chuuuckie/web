import { put, takeLatest } from 'redux-saga/effects';
import update from 'immutability-helper';
import { notification } from 'antd';
import api from 'utils/api';
import { extractErrorMessage } from 'utils/errorMessage';

/*--------- CONSTANTS ---------*/
const SET_ETH_ADDRESS_BEGIN = 'SET_ETH_ADDRESS_BEGIN';
const SET_ETH_ADDRESS_SUCCESS = 'SET_ETH_ADDRESS_SUCCESS';
const SET_ETH_ADDRESS_FAILURE = 'SET_ETH_ADDRESS_FAILURE';

/*--------- ACTIONS ---------*/
export function setEthAddressBegin(address, message, signature) {
  return { type: SET_ETH_ADDRESS_BEGIN, address, message, signature };
}

function setEthAddressSuccess(result) {
  return { type: SET_ETH_ADDRESS_SUCCESS, result };
}

function setEthAddressFailure(message) {
  return { type: SET_ETH_ADDRESS_FAILURE, message };
}

/*--------- REDUCER ---------*/
export function setEthAddressReducer(state, action) {
  switch (action.type) {
    case SET_ETH_ADDRESS_BEGIN:
      return update(state, {
        isUpdating: { $set: true },
      });
    case SET_ETH_ADDRESS_SUCCESS:
      const { result } = action;

      return update(state, {
        ethAddress: { $set: result.eth_address },
        isUpdating: { $set: false },
      });
    case SET_ETH_ADDRESS_FAILURE:
      return update(state, {
        isUpdating: { $set: false },
      });
    default:
      return state;
  }
}

/*--------- SAGAS ---------*/
function* setEthAddress({ address, message, signature }) {
  try {
    const result = yield api.post(`/users/set_eth_address.json`, { eth_address: address, eth_message: message, eth_signature: signature}, true);
    yield put(setEthAddressSuccess(result));
  } catch(e) {
    yield notification['error']({ message: extractErrorMessage(e) });
    yield put(setEthAddressFailure(e.message));
  }
}

export default function* setEthAddressManager() {
  yield takeLatest(SET_ETH_ADDRESS_BEGIN, setEthAddress);
}
