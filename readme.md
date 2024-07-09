# Basic Solana SPL transfer

### About this repo
This repo contains simple example functions that show how to transfer SPL tokens on the Solana blockchain using the web3.js library.

### How to use the code
1. Create an express server or server using a framework of your choice.
2. Install dependencies listed in package.json.
3. Copy the utils folder into your project.
4. Create a route like the basic example in routes.ts.
5. Run the server.
6. Using postman or a similar tool, send a POST request to the route you created with the following body:

```json
{
    "from": "your_wallet_address", // string
    "to": "recipient_wallet_address", // string
    "tokenAddress": "token_address", // string
    "amount": 1 // number
}
```
7. The server will return a versioned transaction which can be used to sign and send the transaction to the Solana network via a wallet on a client or keypair signer on a server.

