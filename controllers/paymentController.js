const catchAsyncError = require("../middlewares/catchAsyncError");

const stripe = require("stripe")(
  "sk_test_51Nyf3QSBAIUCM70PgULicwwJuzGndvlhffEGXYMQtVlgy8hsvJrcCvQ9EwppJWnW7Lr1XpOvhajurm7KdLX36pv400bI8ashf2"
);

exports.processPayment = catchAsyncError(async (req, res, next) => {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: req.body.amount,
    currency: "INR",
    description: "TEST PAYMENT",
    metadata: { integration_check: "accept_payment" },
    shipping: req.body.shipping,
  });

  res.status(200).json({
    success: true,
    client_secret: paymentIntent.client_secret,
  });
});

exports.sendStripeApi = catchAsyncError(async (req, res, next) => {
  res.status(200).json({
    stripeApiKey: process.env.STRIPE_PUBLIC_KEY,
  });
});
