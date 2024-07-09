import { Express, Request, Response } from "express";
import { transferSplToken } from "../utils/solana-transactions/transactions";

function routes(app: Express) {

    app.get("/healthcheck", (req: Request, res: Response) => res.sendStatus(200));

    // Returns a versioned transaction for a token transfer.
    // If called from a client the transaction can be signed by a wallet and sent to the network.
    // If called from a server the transaction can be signed by a keypair on the server and sent to the network.
    // Signing and sending logic would need to be handled by the client or server respectively that made the post request.
    app.post("/tokentransfer", async (req: Request, res: Response) => {
        const { from, to, token, amount } = req.body;

        if (!from || !to || !amount) {
            return res.status(400).send("Invalid request body");
        }

        const transaction = await transferSplToken(from, to, token, amount);

        res.status(200).json({
            transaction
        });
    });
}

export { routes };
