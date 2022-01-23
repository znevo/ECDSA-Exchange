const SHA256 = require('crypto-js/sha256');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

const Seeder = require('./seeder.js');
const blockchain = new Seeder();

// Generate test wallets and log to console
blockchain.seed();
blockchain.dump();

class BlockChainController {
  msgs = {
    INVALID_FIELDS:     'All fields are required to complete this transaction.',
    INVALID_KEYS:       'The public and private keys are not valid.',
    INVALID_SIGNATURE:  'A valid signature is required to complete this transaction.',
    INVALID_RECIPIENT:  'A valid recipient is required to complete this transaction.',
    VALID_SIGNATURE:    'A valid digital signature has been generated and verified.',
    VALID_TRANSACTION:  'Your transaction was successful.',
  }

  balance(req, res) {
    const { address } = req.params;
    const wallet = blockchain.wallets.get(address);

    res.send({
      status: 'success',
      data: {
        balance: wallet ? wallet.balance : 0,
      }
    });
  }

  verifySignature(req, res) {
    if ( ! this.signatureIsVerifiable(req.body) ) {
      res.send({
        status: 'error',
        message: this.msgs.INVALID_KEYS,
      });
    } else {
      res.send({
        status: 'success',
        message: this.msgs.VALID_SIGNATURE
      });
    }
  }

  signatureIsVerifiable(data) {
    const { sender, recipient, amount, signature } = data;

    try {
      const wallet = blockchain.wallets.get(sender);
      const key = ec.keyFromPublic(wallet.publicKey, 'hex');
      const msg = { sender, amount, recipient };
      const hash = SHA256(JSON.stringify(msg)).toString();

      return key.verify(hash, signature);
    } catch {
      return false;
    }
  }

  requestIsValid(data) {
    const { sender, recipient, amount, signature } = data;
    return ! [sender, recipient, amount, signature.r, signature.s].includes('');
  }

  createTransaction(req, res) {
    if ( ! this.requestIsValid(req.body) ) {
      res.send({
        status: 'error',
        message: this.msgs.INVALID_FIELDS,
      });

      return false;
    }

    if ( ! this.signatureIsVerifiable(req.body) ) {
      res.send({
        status: 'error',
        message: this.msgs.INVALID_SIGNATURE,
      });

      return false;
    }

    const { sender, recipient, amount, signature } = req.body;
    const senderWallet = blockchain.wallets.get(sender);
    const recipientWallet = blockchain.wallets.get(recipient);

    if ( ! recipientWallet ) {
      res.send({
        status: 'error',
        message: this.msgs.INVALID_RECIPIENT,
      });

      return false;
    }

    senderWallet.balance -= amount;
    recipientWallet.balance = (recipientWallet.balance || 0) + +amount;

    // Update console with new wallet balances
    blockchain.dump();

    res.send({
      status: 'success',
      message: this.msgs.VALID_TRANSACTION,
      data: {
        balance: senderWallet.balance
      }
    });
  }
}

module.exports = BlockChainController;
