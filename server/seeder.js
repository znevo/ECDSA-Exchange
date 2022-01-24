const secp = require("ethereum-cryptography/secp256k1");
const { toHex } = require("ethereum-cryptography/utils");

class BlockchainSeeder {
  constructor() {
    this.wallets = new Map();
  }

  seed(count = 3) {
    while ( this.wallets.size < count ) {
      const privateKey = toHex(secp.utils.randomPrivateKey());
      const publicKey = toHex(secp.getPublicKey(privateKey));

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
