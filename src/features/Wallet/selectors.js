import { createSelector } from 'reselect';

const selectWalletDomain = () => state => state.wallet;

export const selectBalance = () => createSelector(
  selectWalletDomain(),
  state => state.balance,
);

export const selectExternalBalance = () => createSelector(
  selectWalletDomain(),
  state => state.externalBalance,
);

export const selectEthAddress = () => createSelector(
  selectWalletDomain(),
  state => state.ethAddress,
);

export const selectTransactions = () => createSelector(
  selectWalletDomain(),
  state => state.transactions,
);

export const selectWithdrawals = () => createSelector(
  selectWalletDomain(),
  state => state.withdrawals,
);

export const selectIsLoading = () => createSelector(
  selectWalletDomain(),
  state => state.isLoading,
);

export const selectIsUpdating = () => createSelector(
  selectWalletDomain(),
  state => state.isUpdating,
);

