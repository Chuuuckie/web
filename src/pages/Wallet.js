import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { createStructuredSelector } from 'reselect';
import { connect } from 'react-redux';
import { Helmet } from 'react-helmet';
import isEmpty from 'lodash/isEmpty';
import { keccak256 } from 'js-sha3';
import { List, Avatar, Button, Tooltip, Modal, Icon, Input, InputNumber, Tabs } from 'antd';
import { formatNumber } from "utils/helpers/steemitHelpers";
import {
  selectBalance,
  selectSPToClaim,
  selectEthAddress,
  selectTransactions,
  selectWithdrawals,
  selectIsLoading,
  selectIsClaiming,
  selectIsUpdating,
} from 'features/Wallet/selectors';
import { getTransactionsBegin } from 'features/Wallet/actions/getTransactions';
import { claimTokensBegin } from 'features/Wallet/actions/claimTokens';
import { withdrawBegin } from 'features/Wallet/actions/withdraw';
import { setEthAddressBegin } from 'features/Wallet/actions/setEthAddress';
import CircularProgress from 'components/CircularProgress';
import { selectMe } from 'features/User/selectors';
import { shortFormat } from 'utils/date';
import tokenPlaceholder from 'assets/images/wallet/token-placeholder@2x.png';

class Wallet extends Component {
  static propTypes = {
    me: PropTypes.string.isRequired,
    balance: PropTypes.string.isRequired,
    spToClaim: PropTypes.number.isRequired,
    withdrawals: PropTypes.array.isRequired,
    transactions: PropTypes.array.isRequired,
    isLoading: PropTypes.bool.isRequired,
    getTransactions: PropTypes.func.isRequired,
    claimTokens: PropTypes.func.isRequired,
    withdraw: PropTypes.func.isRequired,
    ethAddress: PropTypes.string,
    isUpdating: PropTypes.bool.isRequired,
  };

  state = {
    modalVisible: false,
    withdrawStepVisible: false,
    ethAddress: null,
    ethModalVisible: false,
    withdrawalAmount: 1000.00,
    activeTabKey: '1',
  };

  componentDidMount() {
    this.props.getTransactions();
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.ethAddress !== null) {
      this.setState({ ethModalVisible: false });
    }
  }

  isValidAddress(address) {
    if (!/^0x[0-9a-f]{40}$/i.test(address)) {
      // check if it has the basic requirements of an address
      return false;
    } else if (/^0x[0-9a-f]{40}$/.test(address) || /^0x[0-9A-F]{40}$/.test(address)) {
      // If it's all small caps or all all caps, return true
      return true;
    } else {
      // Otherwise check each case
      return this.isValidChecksumAddress(address);
    }
  }

  isValidChecksumAddress(address) {
    // Check each case
    address = address.replace('0x','');
    var addressHash = keccak256(address.toLowerCase());
    for (var i = 0; i < 40; i++ ) {
      // the nth letter should be uppercase if the nth digit of casemap is 1
      if ((parseInt(addressHash[i], 16) > 7 && address[i].toUpperCase() !== address[i]) || (parseInt(addressHash[i], 16) <= 7 && address[i].toLowerCase() !== address[i])) {
        return false;
      }
    }
    return true;
  }

  showModal = () => this.setState({ modalVisible: true });
  handleCancel = (e) => this.setState({ modalVisible: false });
  handleEthAddressChanged = (e) => this.setState({ ethAddress: e.target.value });
  handleWithdrawalAmountChanged = (amount) => this.setState({ withdrawalAmount: amount });
  handleWithdraw = () => {
    this.props.withdraw(this.state.withdrawalAmount);
    this.setState({ activeTabKey: '2' });
  }
  handleEthModalCancel = (e) => this.setState({ ethModalVisible: false });
  linkEthAddress = () => {
    if (!this.isValidAddress(this.state.ethAddress)) {
      Modal.error({
        title: 'Incorrect address',
        content: 'The Ethereum address you entered is invalid. Please check it again.',
      });
    } else {
      this.setState({ ethModalVisible: true });
    }
  }

  render() {
    const { me, balance, isLoading, transactions, withdrawals, spToClaim, ethAddress, isClaiming, isUpdating } = this.props;

    if (isLoading || isEmpty(me)) {
      return <CircularProgress />;
    }

    return (
      <div className="wallet">
        <Helmet>
          <title>Wallet - Steemhunt</title>
        </Helmet>

        <div className="balance-bar left-padded right-padded">
          <div className="left">
            <div className="sans small">Token Balance</div>
            <div className="sans balance">{formatNumber(balance)} HUNT</div>
          </div>
          <div className="right">
            <Button
              type="primary"
              onClick={this.showModal}
              className="submit-button"
              ghost
            >
              SP CLAIM
            </Button>

            {spToClaim > 0 ?
              <Modal
                title="Airdrop for SP Holders"
                visible={this.state.modalVisible}
                onCancel={this.handleCancel}
                footer={[
                  <Button key="back" onClick={this.handleCancel}>Cancel</Button>,
                  <Button key="submit" type="primary" loading={isClaiming} onClick={this.props.claimTokens}>
                    Claim HUNT Tokens
                  </Button>,
                ]}
              >
                <div>
                  You have <span className="pink">{formatNumber(spToClaim)} HUNT</span> tokens to claim
                  <div className="text-small">1:1 ratio of your Steem Power (based on STEEM per VEST: 0.000495)</div>
                </div>
                <div className="top-margin">Do you want to claim your HUNT tokens?</div>
              </Modal>
            :
              <Modal
                title="Airdrop for SP Holders"
                visible={this.state.modalVisible}
                onCancel={this.handleCancel}
                footer={[
                  <Button key="ok" onClick={this.handleCancel} type="primary">OK</Button>
                ]}
              >
                <div>
                  <Icon type="check-circle" className="pink"/>&nbsp;
                  You have successfully claimed your token
                </div>
              </Modal>
            }
            <Tooltip title="ERC-20 token withdraw feature will be released on 20 Aug 2018.">
              <Button
                type="primary"
                className="submit-button"
                // onClick={() => {
                //   this.setState({ withdrawStepVisible: !this.state.withdrawStepVisible });
                //   this.setState({ activeTabKey: '2' });
                // }}
                ghost
              >
                WITHDRAW
              </Button>
            </Tooltip>
          </div>
        </div>

        {this.state.withdrawStepVisible &&
          <div>
            {ethAddress === null ?
              <div className="eth-bar left-padded right-padded">
                <div className="sans small">Link Your Ethereum Wallet</div>
                <Input
                  placeholder="Your wallet address (e.g. 0xABCD1234...)"
                  onChange={this.handleEthAddressChanged}
                  className="input"
                />
                <Button
                  type="primary"
                  className="submit-button right"
                  onClick={this.linkEthAddress}
                  ghost
                >
                  LINK
                </Button>
                <Modal
                  closable={false}
                  visible={this.state.ethModalVisible}
                  onCancel={this.handleEthModalCancel}
                  footer={[
                    <Button key="back" onClick={this.handleEthModalCancel}>Cancel</Button>,
                    <Button key="submit" type="primary" loading={isUpdating} onClick={() => this.props.setEthAddress(this.state.ethAddress)}>
                      OK
                    </Button>,
                  ]}
                >
                  <div>
                    Are you sure that this is the ETH address you want to link to your Steemhunt wallet?
                    <p className="pink" style={{ marginTop: '1.2em' }}>{this.state.ethAddress}</p>
                    <b>WARNING!</b>
                    Do not request HUNT directly to exchange addresses. This will result in lost tokens that won't be refunded.
                    Once you link your ETH address, <b>you cannot change it later</b>. Please double check that you have entered it correctly.
                  </div>
                </Modal>
              </div>
            :
              <div className="withdraw-bar left-padded right-padded">
                <div className="sans small">Your Ethereum Address</div>
                <div className="sans balance eth-address">{ethAddress}</div>
                <div className="sans small">
                  Amount to withdraw&nbsp;
                  <Tooltip title="When transferring HUNT to your Ethereum wallet, one of the parties has to pay a commission for the transfer. For now, we have decided to cover this fee ourselves and introduced this limit to prevent overspending.">
                    (minimum: 1000 HUNT <Icon type="question-circle" />)
                  </Tooltip>
                </div>
                <InputNumber
                  placeholder="Amount to withdraw"
                  className="input"
                  min={1000}
                  defaultValue={1000}
                  onChange={this.handleWithdrawalAmountChanged}
                  precision={2}
                />
                HUNT
                <Button
                  type="primary"
                  loading={isLoading}
                  className="submit-button right"
                  onClick={() => {
                    const self = this;
                    Modal.confirm({
                      title: 'Are you sure withdraw HUNT tokens?',
                      content: <div>{formatNumber(this.state.withdrawalAmount)} HUNT tokens will be sent to your registered ETH address:<div>{ethAddress}</div></div>,
                      width: 450,
                      onOk() {
                        self.handleWithdraw();
                      },
                    });
                  }}
                  ghost
                >
                  WITHDRAW
                </Button>
              </div>
            }
          </div>
        }


        <Tabs activeKey={this.state.activeTabKey} onTabClick={(key) => this.setState({ activeTabKey: key })}>
          <Tabs.TabPane tab="Airdrop" key="1">
            {transactions.length === 0 ?
              <div className="placeholder">
                <img src={tokenPlaceholder} alt="No transactions" />
                <p>No Transactions Yet</p>
              </div>
            :
              <List
                itemLayout="horizontal"
                dataSource={transactions}
                className="transactions"
                renderItem={t => (
                  <List.Item className="left-padded transaction-item">
                    <List.Item.Meta
                      avatar={me === t.sender ?
                        <Avatar icon="arrow-right" className="icon sent"/>
                      :
                        <Avatar icon="arrow-left" className="icon received" />
                      }
                      title={me === t.sender ?
                        <div className="title sent">
                          {`Sent ${formatNumber(t.amount)} to ` + (t.receiver ? `@${t.receiver}` : `ETH Wallet (${t.eth_address})`)}
                        </div>
                      :
                        <div className="title received">
                          {`Received ${formatNumber(t.amount)} from ` + (t.sender ? `@${t.sender}` : `ETH Wallet (${t.eth_address})`)}
                        </div>
                      }
                      description={
                        <div>
                          <div className="memo">{t.memo}</div>
                          <div className="date">{shortFormat(t.created_at)}</div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            }
          </Tabs.TabPane>
          <Tabs.TabPane tab="Withdrawals" key="2">
            {withdrawals.length === 0 ?
              <div className="placeholder">
                <img src={tokenPlaceholder} alt="No transactions" />
                <p>No Withdrawals Yet</p>
              </div>
            :
              <List
                itemLayout="horizontal"
                dataSource={withdrawals}
                className="transactions"
                renderItem={w => (
                  <List.Item className="left-padded transaction-item">
                    <List.Item.Meta
                      avatar={w.status === 'sent' ?
                          <Avatar icon="arrow-right" className="icon sent"/>
                        :
                          (w.status === 'error' ?
                            <Avatar icon="exclamation" className="icon error"/>
                          :
                            <Avatar icon="loading" className="icon pending"/>
                          )
                      }
                      title={
                        <div className="title sent">
                          {`Withdraw ${formatNumber(w.amount)} HUNT`}
                        </div>
                      }
                      description={
                        <div>
                          <div className="memo">
                            Status: {w.status}
                            {w.tx_hash &&
                              <span>/ Transaction: {w.tx_hash}</span>
                            }
                          </div>
                          <div className="date">{shortFormat(w.created_at)}</div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            }
          </Tabs.TabPane>
        </Tabs>
      </div>
    );
  }
}

const mapStateToProps = (state, props) => createStructuredSelector({
  me: selectMe(),
  balance: selectBalance(),
  transactions: selectTransactions(),
  withdrawals: selectWithdrawals(),
  isLoading: selectIsLoading(),
  spToClaim: selectSPToClaim(),
  isClaiming: selectIsClaiming(),
  ethAddress: selectEthAddress(),
  isUpdating: selectIsUpdating(),
});

const mapDispatchToProps = (dispatch, props) => ({
  getTransactions: () => dispatch(getTransactionsBegin()),
  claimTokens: () => dispatch(claimTokensBegin()),
  setEthAddress: (address) => dispatch(setEthAddressBegin(address)),
  withdraw: (amount) => dispatch(withdrawBegin(amount)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Wallet);
