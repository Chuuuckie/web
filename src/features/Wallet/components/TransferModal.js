import React, { Component } from "react";
import { Modal, Popconfirm, Input, Button, Checkbox } from 'antd';
import { formatNumber } from "utils/helpers/steemitHelpers";

export default class TransferModal extends Component {

  state = {
    message: null,
    transferAmount: 2000.00 < this.props.walletProps.balance ? 2000.00 : this.props.walletProps.balance,
    agreement: false,
  }

  componentDidMount() {
    if (this.props.walletProps.balance < 2000) {
      this.setState({ message: "You have to have at leat 2,000 HUNT to transfer." })
    }
  }

  handleWithdrawalAmountChanged = (amount) => {
    if (!/^\d*\.?\d*$/.test(amount)) {
      return false;
    }
    let msg;
    if (amount > parseFloat(this.props.walletProps.balance)) {
      msg = "You typed more tokens than your balance.";
    } else if (amount < 2000) {
      msg = "You have to transfer at leat 2,000 HUNT.";
    } else {
      msg = null;
    }
    this.setState({ transferAmount: amount, message: msg });
  }

  render() {
    const { balance, isLoading, ethAddress } = this.props.walletProps;

    return (
      <Modal
        title="Transfer to External Wallet"
        visible={this.props.modalVisible}
        onCancel={this.props.modalToggle}
        className={"transfer-modal"}
        footer={[
          <Popconfirm key="submit" placement="topRight" title={`Transfer ${formatNumber(this.state.transferAmount)}HUNT tokens to\n${(ethAddress || '').slice(0, 8)}.. ?`} onConfirm={() => this.props.handleTransfer(this.state.transferAmount)} okText="Yes" cancelText="No">
            <Button type="primary"
              loading={isLoading}
              disabled={this.state.transferAmount < 2000 || this.state.transferAmount > parseFloat(balance) || !this.state.agreement}>
              Submit
            </Button>
          </Popconfirm>,
        ]}
      >
        <div className="sans small">Steemhunt Wallet Balance</div>
        <h1 className="sans pink hunt-balance">{formatNumber(balance)} <span className="hunt-text">HUNT</span></h1>
        <div className="sans small subtitle">Important</div>
        <ul>
          <li>Minimum withdrawal: 2,000 HUNT</li>
          <li>You can transfer it to only the one registered external wallet</li>
        </ul>
        <div className="sans small subtitle">Registered Wallet Address</div>
        <Input placeholder={ethAddress} disabled />
        <div className="sans small subtitle">Amount</div>
        <div className={this.state.message ? 'has-error' : ''}>
          <Input
            placeholder="Min 2,000 HUNT"
            value={this.state.transferAmount}
            suffix={<a onClick={() => this.handleWithdrawalAmountChanged(balance)}>Max</a>}
            onChange={(e) => this.handleWithdrawalAmountChanged(e.target.value)}
          />
          {this.state.message && <div className="ant-form-explain top-margin">{this.state.message}</div>}
        </div>
        <div className="top-margin">
          <p className="agreement-text subtitle">
            Please check the address carefully before requesting transfer.
            Transfer request cannot be canceled once it is completed.
            Steemhunt holds no liability over the losses incurred as a result of the wrong information.
            Also, we may suspend transfers related to suspicious transactions, such as identity theft, fraud, abusing, or hacking.
            Steemhunt is not responsible for damages caused by illegal transactions of its users.
          </p>
          <Checkbox onChange={(e) => this.setState({ agreement: e.target.checked })}>I have read and consent to the following agreement.</Checkbox>
        </div>
      </Modal>
    )
  }
}