import { configDotenv } from "dotenv";
configDotenv({ path: ".env" });

import express from "express";
import Stripe from "stripe";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import * as fal from "@fal-ai/serverless-client";
import * as falProxy from "@fal-ai/serverless-proxy/express";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const stripeSecretKey = process.env.REACT_APP_STRIPE_SCREAT_KEY;
if (!stripeSecretKey) {
  console.error('Stripe secret key is not set in environment variables.');
  process.exit(1);
}
const stripe = new Stripe(stripeSecretKey);

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(join(__dirname, 'public')));
app.use(cors());
app.use(express.static('public'));

app.get('/', (req, res) => {
  // Serve your 'index.html' file
  res.sendFile(join(__dirname, 'index.html'));
});



app.all(falProxy.route, cors(), falProxy.handler);
app.post("/digitalart/text-to-art", async (req, res) => {
  const { prompt, diffusionInferenceSteps } = req.body; // Extracting diffusionInferenceSteps from the request body
  if (!prompt) {
    return res.status(400).send("Prompt is required");
  }
  if (!diffusionInferenceSteps) {
    return res.status(400).send("Diffusion inference steps are required");
  }
  try {
    const result = await fal.subscribe("fal-ai/fast-lightning-sdxl", {
      input: {
        prompt: prompt,
        seed: Number((Math.random() * 10000000).toFixed(0)),
        _force_msgpack: new Uint8Array([]),
        enable_safety_checker: true,
        image_size: "square_hd",
        sync_mode: true,
        num_images: 1,
        num_inference_steps: diffusionInferenceSteps, // Using the value from the request
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          update.logs.map((log) => log.message).forEach(console.log);
        }
      },
    });
    res.send(result);
  } catch (e) {
    console.error(e);
    res.status(500).send("An error occurred while processing your request. Please try again later.");
  }
});



app.post("/payment", async (req, res) => {
  const { token } = req.body;
  try {
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
          price: "price_1LUzZ0SBthRp6nG0e2TU7vIn",
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${YOUR_DOMAIN}/dasboard`,
      cancel_url: `${YOUR_DOMAIN}/dashboard`,
    });

    res.json({ result: session, token: token });
  } catch (err) {
    res.json({ err });
  }
});

app.post("/paymentpro", async (req, res) => {
  const { token } = req.body;
  try {
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
          price: "price_1LUzp3SBthRp6nG00SqOCobO",
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${YOUR_DOMAIN}/dasboard`,
      cancel_url: `${YOUR_DOMAIN}/dashboard`,
    });

    res.json({ result: session, token: token });
  } catch (err) {
    res.json({ err });
  }
});
// const idempotencyKey = uuid();

// return stripe.customers
//   .create({
//     email: token.email,
//     source: token.id
//   })
//   .then(customer => {
//     stripe.charges.create(
//       {
//         amount: 7000,
//         currency: "usd",
//         customer: customer.id,
//         receipt_email: token.email,
//         description: `purchase of Plan`
//       },
//       {idempotencyKey}
//     );
//   })
//   .then(result => {res.json({'result':"success",'token':token})})
//   .catch(err => console.log(err));
//});

//listen

app.listen(8282, () => console.log("LISTENING AT PORT 8282"));
