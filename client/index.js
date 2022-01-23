import './index.scss';

const server = 'http://localhost:3042';

import Exchange from './exchange.js';
const exchange = new Exchange(server);

import element from './element.js';

element("sender").addEventListener('input', exchange.fetchBalance.bind(exchange) );
element("create-transaction").addEventListener('click', exchange.createTransaction.bind(exchange) );
element("sign-transaction").addEventListener('click', exchange.signTransaction.bind(exchange) );
