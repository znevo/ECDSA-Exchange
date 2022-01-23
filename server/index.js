const express = require('express');
const app = express();
const cors = require('cors');
const port = 3042;

const BCController = require('./blockchain.js');
const bcController = new BCController();

// localhost can have cross origin errors
// depending on the browser you use!
app.use(cors());
app.use(express.json());

app.get('/balance/:address', bcController.balance);
app.post('/send', bcController.createTransaction.bind(bcController));
app.post('/verify', bcController.verifySignature.bind(bcController));

app.listen(port, () => {
  console.log(`\nListening on port ${port}!`);
});
