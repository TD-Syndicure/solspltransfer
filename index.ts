'use strict'
const express = require('express')
import cors from "cors";
import dotenv from "dotenv";
import { routes } from "./routes/routes";

const app = express()
dotenv.config();

const corsOptions = {
  origin: "*",
  optionsSuccessStatus: 204,
  methods: ["GET", "POST", "OPTIONS"],
}

// Routes and middleware
app.use(cors(corsOptions));
app.use(express.json());

routes(app);

// Error handlers
app.use(function fourOhFourHandler (req, res) {
  res.status(404).send()
})
app.use(function fiveHundredHandler (err, req, res, next) {
  console.error(err)
  res.status(500).send()
})

// Start server
app.listen(1234, function (err) {
  if (err) {
    return console.error(err)
  }

  console.log('Started at http://localhost:1234')
})
