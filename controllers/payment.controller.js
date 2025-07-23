import { stripe } from "./../lib/stripe.js";
import Order from "./../models/order.model.js";

async function createStripeCoupon(discountPercentage) {
  const coupon = await stripe.coupons.create({
    percent_off: discountPercentage,
    duration: "once",
  });
  return coupon.id;
}
export const createCheckoutSession = async (req, res) => {
  try {
    const { products, couponCode } = req.body;
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        message: "Invalid or empty products array",
      });
    }
    let totalAmount = 0;
    const lineItems = products.map((item) => {
      const amount = Math.round(item.price * 100);
      totalAmount += amount * item.quantity;
      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: item.name,
            images: [item.image],
          },
          unit_amount: amount,
        },
        quantity: item.quantity || 1,
      };
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.FRONT_END_LINK}/puchase-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONT_END_LINK}/purchase-cancel`,

      metadata: {
        userId: req.user._id.toString(),
        products: JSON.stringify(
          products.map((p) => ({
            id: p._id,
            quantity: p.quantity,
            price: p.price,
          }))
        ),
      },
    });
    if (totalAmount > 20000) {
      await createNewCoupon(req.user._id.toString());
    }
    res.status(200).json({
      id: session.id,
      totalAmount: totalAmount / 100,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error : " + error.message,
    });
  }
};

export const checkoutSuccess = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status === "paid") {
      const products = JSON.parse(session.metadata.products);

      const newOrder = new Order({
        user: session.metadata.userId,
        products: products.map((product) => ({
          product: product.id,
          quantity: product.quantity,
          price: product.price,
        })),
        totalAmount: session.amount_total / 100,
        stripeSessionId: sessionId,
      });
      await newOrder.save();
      res.status(200).json({
        success: true,
        message:
          "Order created, payment successful,and coupon deactivated if used",
        orderId: newOrder._id,
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal server Error : " + error.message,
    });
  }
};
