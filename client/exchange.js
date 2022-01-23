const EC = require('elliptic').ec;
const SHA256 = require('crypto-js/sha256');

import Flash from './flash.js';
const flash = new Flash();

import element from './element.js';

class Exchange {
  msgs = {
    ERROR_SERVER:       'There was a problem communicating with the server.',
    ERROR_KEY_REQUIRED: 'A private key is required to sign this transaction.',
  }

  constructor(server) {
    this.server = server;
    this.UI = {
      balance: element('balance'),
      sender: element('sender'),
      amount: element('amount'),
      recipient: element('recipient'),
      privateKey: element('private-key'),
      signature: {
        r: element('signature-r'),
        s: element('signature-s'),
      },
    };
  }

  form() {
    return {
      sender: this.UI.sender.value,
      amount: this.UI.amount.value,
      recipient: this.UI.recipient.value,
      privateKey: this.UI.privateKey.value,
      signature: {
        r: this.UI.signature.r.value,
        s: this.UI.signature.s.value,
      },
    }
  }

  fetchBalance({ target: {value} }) {
    if ( value === '' ) {
      this.updateBalance(0);
      return;
    }

    fetch(`${this.server}/balance/${value}`).then((response) => {
      return response.json();
    }).then(({ data }) => {
      this.updateBalance(data.balance);
    });
  }

  updateBalance(balance) {
      this.UI.balance.innerHTML = balance;
  }

  generateSignature(privateKey, transaction) {
    const ec = new EC('secp256k1');
    const key = ec.keyFromPrivate(privateKey);
    const hash = SHA256(JSON.stringify(transaction));

    return key.sign(hash.toString());
  }

  updateSignature(signature) {
      this.UI.signature.r.value = signature.r.toString(16);
      this.UI.signature.s.value = signature.s.toString(16);
  }

  resetSignature(signature) {
      this.UI.signature.r.value = '';
      this.UI.signature.s.value = '';
  }

  signTransaction() {
    this.resetSignature();

    const { sender, amount, recipient, privateKey } = this.form();

    if ( privateKey === '' ) {
      flash.error(this.msgs.ERROR_KEY_REQUIRED);
      return;
    }

    const signature = this.generateSignature(privateKey, { sender, amount, recipient });
    const body = JSON.stringify({ sender, amount, recipient, signature });
    const request = new Request(`${this.server}/verify`, { method: 'POST', body });

    fetch(request, {
      headers: { 'Content-Type': 'application/json' }
    }).then(response => {
      return response.json();
    }).then((response) => {
      if ( response.status == 'success' ) {
        this.updateSignature(signature);
        flash.msg(response.message);
      } else if ( response.status == 'error' ) {
        flash.error(response.message);
      }
    }).catch(() => {
      flash.error(this.msgs.ERROR_SERVER);
    });
  }

  createTransaction() {
    const { sender, amount, recipient, signature } = this.form();

    const body = JSON.stringify({ sender, amount, recipient, signature });
    const request = new Request(`${this.server}/send`, { method: 'POST', body });

    fetch(request, {
      headers: { 'Content-Type': 'application/json' }
    }).then(response => {
      return response.json();
    }).then((response) => {
      if ( response.status == 'success' ) {
        this.updateBalance(response.data.balance);
        flash.msg(response.message);
      } else if ( response.status == 'error' ) {
        flash.error(response.message);
      }
    }).catch(() => {
      flash.error(this.msgs.ERROR_SERVER);
    });
  }
}

export default Exchange;
