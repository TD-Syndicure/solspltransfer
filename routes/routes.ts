import { Express, Request, Response } from "express";
import { transferSplToken } from "../utils/solana-transactions/transactions";

function routes(app: Express) {

    app.get("/healthcheck", (req: Request, res: Response) => res.sendStatus(200));

    // Returns a versioned transaction for a token transfer for a wallet or backend service to sign and send
    app.post("/tokentransfer", async (req: Request, res: Response) => {
        const { from, to, amount } = req.body;

        if (!from || !to || !amount) {
            return res.status(400).send("Invalid request body");
        }

        const transaction = await transferSplToken(from, to, amount);

        res.status(200).json({
            transaction
        });
    });
}

export { routes };
