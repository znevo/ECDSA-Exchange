const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

class BlockchainSeeder {
  constructor() {
    this.wallets = new Map();
  }

  seed(count = 3) {
    while ( this.wallets.size < count ) {
      const key = ec.genKeyPair();
      const publicKey = key.getPublic().encode('hex');
      const privateKey = key.getPrivate().toString(16);

      this.wallets.set(publicKey.slice(-40), {
        index: this.wallets.size, // prettier logs
        publicKey,
        privateKey,
        balance: 100
      });
    }
  }

  dump() {
    this.dumpWallets();
    this.dumpKeys();
  }

  dumpWallets() {
    console.log('\nAvailable Accounts\n==================');
    for (const [addr, wallet] of this.wallets) {
      console.log(`(${wallet.index}) ${addr} (${wallet.balance} ETH)`);
    }
  }

  dumpKeys() {
    console.log('\nPrivate Keys\n==================');
    for (const [addr, wallet] of this.wallets) {
      console.log(`(${wallet.index}) ${wallet.privateKey}`);
    }
  }
}

module.exports = BlockchainSeeder;
