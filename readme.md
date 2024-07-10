# Solana SPL transfer script

### About this repo
This repo contains simple function to transfer solana spl-tokens using durable nonces.

### How to use the code
1. Populate the function with the data for the transfer you want to create.
```typescript
transferSplToken(
    "from", // sender address as string
    "to", // receiver address as string
    "tokenAddress", // mint address as string (note not the user ata)
    100, // amount to transfer as number
    "nonceAccountPubkey", // nonce account pubkey as string
    "nonceSignerPubkey" // nonce account authority public key as string
)
```
2. Run the function to get the tx and use this to sign with the from account and the nonceSigner and send the transaction.
3. Optionally return the tx from an api endpoint to sign and send the transaction.


### Example log output
```bash
VersionedTransaction {
  signatures: [
    Uint8Array(64) [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0
    ],
    Uint8Array(64) [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0
    ]
  ],
  message: MessageV0 {
    header: {
      numRequiredSignatures: 2,
      numReadonlySignedAccounts: 1,
      numReadonlyUnsignedAccounts: 5
    },
    staticAccountKeys: [
      [PublicKey [PublicKey(ExP5nq9j4sixx4UZ523Rhku9rjpuMVJyboaaRJ2XPiBo)]],
      [PublicKey [PublicKey(EbsUZEFAU23Z2SgAymFtU2hADLiyNLzaPLKiJfvpKnE7)]],
      [PublicKey [PublicKey(5NUAJckcnpGSdDsocx9hBR2zCBos3BTadqurCQoiGyYd)]],
      [PublicKey [PublicKey(6cD6JX9rXFr7WfofyQARUXExJrSJaJNNFkvQcpTPXvR2)]],
      [PublicKey [PublicKey(ComputeBudget111111111111111111111111111111)]],
      [PublicKey [PublicKey(11111111111111111111111111111111)]],
      [PublicKey [PublicKey(SysvarRecentB1ockHashes11111111111111111111)]],
      [PublicKey [PublicKey(MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr)]],
      [PublicKey [PublicKey(TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA)]]
    ],
    recentBlockhash: 'DwvygxzrcTq98ynmfBChcX2wv4QGTzA3hJhsq3K7s8Vg',
    compiledInstructions: [ [Object], [Object], [Object], [Object], [Object] ],
    addressTableLookups: []
  }
}
```