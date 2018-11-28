import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { createStructuredSelector } from 'reselect';
import { connect } from 'react-redux';
import { Helmet } from 'react-helmet';
import isEmpty from 'lodash/isEmpty';
import { List, Avatar, Button, Modal, Icon, Tabs, notification } from 'antd';
import { formatNumber } from "utils/helpers/steemitHelpers";
import {
  selectBalance,
  selectExternalBalance,
  selectEthAddress,
  selectTransactions,
  selectWithdrawals,
  selectIsLoading,
  selectIsUpdating,
} from 'features/Wallet/selectors';
import { getTransactionsBegin } from 'features/Wallet/actions/getTransactions';
import { withdrawBegin } from 'features/Wallet/actions/withdraw';
import { setEthAddressBegin } from 'features/Wallet/actions/setEthAddress';
import CircularProgress from 'components/CircularProgress';
import { selectMe } from 'features/User/selectors';
import { shortFormat } from 'utils/date';
import tokenPlaceholder from 'assets/images/wallet/token-placeholder@2x.png';
import TransferModal from 'features/Wallet/components/TransferModal';
import metaMaskImage from 'assets/images/wallet/img-no-metamask@3x.png';
import initializeWeb3 from 'web3.js';

class Wallet extends Component {
  static propTypes = {
    me: PropTypes.string.isRequired,
    balance: PropTypes.string.isRequired,
    externalBalance: PropTypes.string.isRequired,
    withdrawals: PropTypes.array.isRequired,
    transactions: PropTypes.array.isRequired,
    isLoading: PropTypes.bool.isRequired,
    getTransactions: PropTypes.func.isRequired,
    withdraw: PropTypes.func.isRequired,
    ethAddress: PropTypes.string,
    isUpdating: PropTypes.bool.isRequired,
  };

  state = {
    withdrawStepVisible: true,
    ethAddress: null,
    activeTabKey: '1',
    modalVisible: false,
    transferModalVisible: false,
    agreement: false,
    amountCheckMsg: '',
  };

  toggleModal = () => {
    this.setState({
      modalVisible: !this.state.modalVisible,
    });
  };

  async componentDidMount() {
    this.props.getTransactions();
    this.web3 = initializeWeb3();
    if (this.web3) {
      this.eth_accounts = await this.web3.eth.getAccounts();
      this.eth_network = await this.web3.eth.net.getNetworkType();
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.ethAddress !== null) {
      this.setState({ ethModalVisible: false });
    }
  }

  async validEthereumNetwork() {
    // TODO => Fix phrases to mainnet after lauching.
    if (this.web3 === null) {
      Modal.error({
        title: "Please install Metamask",
        className: "metamask-install-modal",
        autoFocusButton: null,
        maskClosable: true,
        content: (
          <div className={"metamask-install-body"}>
            <p>You need to use Metamask to register your own Ether wallet address.</p>
            <img src={metaMaskImage} alt="Metamask" className="fox" />
          </div>
        ),
        okText: "Get Metamask",
        onOk: () => window.open('https://metamask.io/', '_blank')
      });
      return false;
    }

    if (this.eth_accounts.length === 0) {
      notification['error']({ message: "You need to login on metamask." });
      return false;
    }

    if (this.eth_network !== 'ropsten') {
      Modal.error({
        title: 'Incorrect Network',
        content: `You are currently in ${this.eth_network} network. Please change your network to Ropsten network.`,
      });
    }
    return this.eth_network === 'ropsten';
  }

  requestSignTransaction = async () => {
    if (!(await this.validEthereumNetwork())) {
      return false;
    }
    Modal.success({
      title: "Register External Wallet",
      className: "metamask-install-modal",
      autoFocusButton: null,
      maskClosable: true,
      content: (
        <div className={"metamask-install-body"}>
          <p>You can register your own Ether wallet address by using MetaMask.</p>
          <img src={metaMaskImage} alt="Metamask" className="fox" />
          <p>Please notice that</p>
          <ul>
            <li>You can transfer HUNT tokens from Steemhunt wallet only to the one registered Ether wallet.</li>
            <li>Exchange’s wallet is not able to be registered (MetaMask is required to register).</li>
            <li>The HUNT balance from the wallet address above is automatically added to your total HUNT token balance, which will be counted for your user score.</li>
          </ul>
        </div>
      ),
      okText: "Connect to Metamask",
      onOk: async () => {
        const message = `Register this Ethereum address to your Steemhunt account, ${this.props.me}. (Timestamp: ${new Date().getTime()})`;
        const signature = await this.web3.eth.personal.sign(message, this.eth_accounts[0]);
        this.props.setEthAddress(this.eth_accounts[0], message, signature);
      }
    })
  }

  handleTransfer = (transferAmount) => {
    this.props.withdraw(transferAmount);
    this.setState({ activeTabKey: '2', transferModalVisible: false });
  }
  toggleTransferModal = () => this.setState({ transferModalVisible: !this.state.transferModalVisible });

  render() {
    const { me, balance, externalBalance, isLoading, transactions, withdrawals, ethAddress, isUpdating } = this.props;
    const totalHuntBalance = parseFloat(balance) + parseFloat(externalBalance);
    if (isLoading || isEmpty(me)) {
      return <CircularProgress />;
    }

    return (
      <div className="wallet">
        <Helmet>
          <title>Wallet - Steemhunt</title>
        </Helmet>

        <div className="balance-bar left-padded right-padded">
          <div className="balance-row">
            <div className="sans small">Total HUNT Token Balance</div>
            <div className="sans balance">{formatNumber(totalHuntBalance)} HUNT</div>
          </div>
          <div className="balance-row">
            <div className="sans small">Steemhunt Wallet</div>
            <div className="token-bar-container">
              <div className="token-bar">
                <span className="token-bar-white" style={{ width: `${balance / totalHuntBalance * 100}%` }}></span>
                <span className="token-amount">{`${formatNumber(balance)} (${formatNumber(balance / totalHuntBalance * 100)}%)`}</span>
              </div>
              <div className="token-button">
                <Button
                  type="primary"
                  className="submit-button right"
                  onClick={this.toggleTransferModal}
                >
                  TRANSFER
                </Button>
              </div>
            </div>
          </div>
          <div className="balance-row">
            <div className="sans small">External Wallet - {ethAddress}</div>
            <div className="token-bar-container">
              <div className="token-bar">
                <span className="token-bar-white" style={{ width: `${externalBalance / totalHuntBalance * 100}%` }}></span>
                <span className="token-amount">{`${formatNumber(externalBalance)} (${formatNumber(externalBalance / totalHuntBalance * 100)}%)`}</span>
              </div>
              <div className="token-button">
                <Button
                  type="primary"
                  className="submit-button right"
                  onClick={this.requestSignTransaction}>
                  CHANGE ADDRESS
                </Button>
              </div>
            </div>
          </div>
        </div>
        <TransferModal
          walletProps={this.props}
          modalVisible={this.state.transferModalVisible}
          modalToggle={this.toggleTransferModal}
          handleTransfer={this.handleTransfer}
        />
        <div className="warning left-padded right-padded">
          <span className="pink">Warning!</span>
          &nbsp;Your airdropped HUNT tokens will be cancelled if you are listed on our blacklist.
          &nbsp;<Icon type="question-circle-o" className="help-hunt-score fake-link" onClick={this.toggleModal} />
          <Modal
            title="Airdrops will be removed from Blacklisted users"
            visible={this.state.modalVisible}
            onOk={this.toggleModal}
            onCancel={this.toggleModal}
            footer={null}
            bodyStyle={{
              overflow: 'scroll',
              maxHeight: '50vh',
              WebkitOverflowScrolling: "touch",
            }}
          >
            <p>Your airdropped HUNT tokens will be revoked if you are listed on our <a href="https://github.com/Steemhunt/whitelist/blob/master/steemhunt/blacklist.json" target="_blank" rel="noopener noreferrer">permanent blacklist</a> for abusing the system (this does not apply to those on the 30-day blacklist).</p>
            <p>HUNT token airdrops are designed for hunters/sponsors who contribute by increasing the value of HUNT platform. To maintain this core value, Steemhunt DOES NOT allow single users to run alt accounts to abuse our system.</p>

            <p>We blacklist users if the user attempts any of the following actions:</p>
            <ol>
              <li>Operates multiple alternative accounts to take an advantage for HUNT token airdrops</li>
              <li>Creates spam posts or comments</li>
              <li>Plagiarises</li>
            </ol>
            <p>
              If your name is listed in the <a href="https://github.com/Steemhunt/whitelist/blob/master/steemhunt/blacklist.json" target="_blank" rel="noopener noreferrer">permanent blacklist</a>, your reserved HUNT tokens will be cancelled.<br />
              You can appeal if you think that you&apos;re on the blacklist by a mistake, please leave a message on <a href="https://discord.gg/BSArSDc" target="_blank" rel="noopener noreferrer">#blacklist-appeal</a> channel for review before November 9th 2018.
            </p>
          </Modal>
        </div>

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
                        <Avatar icon="arrow-right" className="icon sent" />
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
          <Tabs.TabPane tab="Transfers" key="2">
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
                        <Avatar icon="arrow-right" className="icon sent" />
                        :
                        (w.status === 'error' ?
                          <Avatar icon="exclamation" className="icon error" />
                          :
                          <Avatar icon="loading" className="icon pending" />
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
                              <span> | TxHash - <a href={`https://ropsten.etherscan.io/tx/${w.tx_hash}`} target="_blank">{w.tx_hash.slice(0, 8)}.. <Icon type="link" /></a></span>
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
  externalBalance: selectExternalBalance(),
  transactions: selectTransactions(),
  withdrawals: selectWithdrawals(),
  isLoading: selectIsLoading(),
  ethAddress: selectEthAddress(),
  isUpdating: selectIsUpdating(),
});

const mapDispatchToProps = (dispatch, props) => ({
  getTransactions: () => dispatch(getTransactionsBegin()),
  setEthAddress: (address, message, signature) => dispatch(setEthAddressBegin(address, message, signature)),
  withdraw: (amount) => dispatch(withdrawBegin(amount)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Wallet);
