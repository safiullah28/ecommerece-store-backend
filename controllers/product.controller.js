import { redis } from "../lib/redis.js";
import Product from "./../models/product.model.js";
import { v2 as cloudinary } from "cloudinary";
export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({});
    res.json(products);
  } catch (error) {
    res.status(500).json({
      message: "Internal server Error : " + error,
    });
  }
};

export const getFeaturedProducts = async (req, res) => {
  try {
    let featuredproducts = await redis.get("featuredProducts");
    if (featuredproducts)
      return res.status(200).json(JSON.parse(featuredproducts));
    featuredproducts = await Product.find({ isFeatured: true }).lean();
    if (!featuredproducts) {
      return res.status(404).json({
        message: "No products found",
      });
    }

    await redis.set("featuredProducts", JSON.stringify(featuredproducts));
    res.json(featuredproducts);
  } catch (error) {
    res.status(500).json({
      message: "Internal server Error : " + error,
    });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { name, description, price, image, category } = req.body;

    let cloudinaryResponse = null;

    if (image) {
      cloudinaryResponse = await cloudinary.uploader.upload(image, {
        folder: "products",
      });
    }

    const product = await Product.create({
      name,
      description,
      price,
      image: cloudinaryResponse?.secure_url
        ? cloudinaryResponse.secure_url
        : "",
      category,
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({
      message: "Internal server Error : " + error,
    });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }
    if (product.image) {
      const publicId = product.image.split("/").pop().split(".")[0];
      try {
        await cloudinary.uploader.destroy(`products/${publicId}`);
      } catch (error) {
        throw error;
      }
    }
    await Product.findByIdAndDelete(id);
    res.json("Product deleted successfully");
  } catch (error) {
    res.status(500).json({
      message: "Internal server Error : " + error,
    });
  }
};

export const getRecommendedProducts = async (req, res) => {
  try {
    const products = await Product.aggregate([
      {
        $sample: { size: 3 },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          image: 1,
          price: 1,
        },
      },
    ]);
    res.json(products);
  } catch (error) {
    res.status(500).json({
      message: "Internal server Error : " + error,
    });
  }
};

export const getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const products = await Product.find({
      category,
    });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({
      message: "Internal server Error : " + error,
    });
  }
};
export const toggleFeaturedProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    } else {
      product.isFeatured = !product.isFeatured;
      const updatedProduct = await product.save();
      await updateFeaturedProductsCache();
      res.json(product);
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal server Error : " + error,
    });
  }
};

async function updateFeaturedProductsCache() {
  try {
    const featuredProducts = await Product.find({ isFeatured: true }).lean();
    await redis.set("featuredProducts", JSON.stringify(featuredProducts));
  } catch (error) {
    res.status(500).json({
      message: "Internal server Error : " + error,
    });
  }
}
