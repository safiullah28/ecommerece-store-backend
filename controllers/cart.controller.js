// controllers/cart.controller.js
import Cart from "../models/cart.model.js";
import Product from "../models/product.model.js";

export const getCartProducts = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.product"
    );

    if (!cart) return res.json([]);

    const cartItems = cart.items.map((item) => ({
      ...item.product.toObject(),
      quantity: item.quantity,
    }));

    res.json(cartItems);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal Server error", error: error.message });
  }
};

export const addToCart = async (req, res) => {
  try {
    const { productId } = req.body;

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    const existingItem = cart.items.find((item) =>
      item.product.equals(productId)
    );

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.items.push({ product: productId, quantity: 1 });
    }

    await cart.save();
    res.json(cart.items);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal Server error", error: error.message });
  }
};

export const removeAllFromCart = async (req, res) => {
  try {
    const { productId } = req.body;
    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) return res.json([]);

    if (productId) {
      cart.items = cart.items.filter((item) => !item.product.equals(productId));
    } else {
      cart.items = [];
    }

    await cart.save();
    res.json(cart.items);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal Server error", error: error.message });
  }
};

export const updateQuantity = async (req, res) => {
  try {
    const { id: productId } = req.params;
    const { quantity } = req.body;

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const item = cart.items.find((item) => item.product.equals(productId));
    if (!item) return res.status(404).json({ message: "Item not found" });

    if (quantity <= 0) {
      cart.items = cart.items.filter((item) => !item.product.equals(productId));
    } else {
      item.quantity = quantity;
    }

    await cart.save();
    res.json(cart.items);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal Server error", error: error.message });
  }
};
