const secp = require("ethereum-cryptography/secp256k1");
const { sha256 } = require("ethereum-cryptography/sha256");
const { toHex, utf8ToBytes } = require("ethereum-cryptography/utils");

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
      signature: element('signature'),
      recovery: element('recovery'),
      hash: element('hash'),
    };
  }

  form() {
    return {
      sender: this.UI.sender.value,
      amount: this.UI.amount.value,
      recipient: this.UI.recipient.value,
      privateKey: this.UI.privateKey.value,
      signature: this.UI.signature.value,
      recovery: this.UI.recovery.value,
      hash: this.UI.hash.value,
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
    const msg = JSON.stringify(transaction);
    const hash = toHex(sha256(utf8ToBytes(msg)));
    const signature = secp.signSync(hash, privateKey, { recovered: true });

    return {
      signature: toHex(signature[0]),
      recovery: signature[1],
      hash
    };
  }

  updateSignature({ signature, recovery, hash }) {
      this.UI.signature.value = signature;
      this.UI.recovery.value = recovery;
      this.UI.hash.value = hash;
  }

  resetSignature(signature) {
      this.UI.signature.value = '';
      this.UI.recovery.value = '';
      this.UI.hash.value = '';
  }

  signTransaction() {
    this.resetSignature();

    const { sender, amount, recipient, privateKey } = this.form();

    if ( privateKey === '' ) {
      flash.error(this.msgs.ERROR_KEY_REQUIRED);
      return;
    }

    const signature = this.generateSignature(privateKey, { sender, amount, recipient });
    const body = JSON.stringify({ sender, amount, recipient, ...signature });
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
    const { sender, amount, recipient, signature, recovery, hash } = this.form();

    const body = JSON.stringify({ sender, amount, recipient, signature, recovery, hash });
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
