import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import express from "express";
import authRoute from "./routes/auth.route.js";
import connectDB from "./config/db.config.js";
import productRoute from "./routes/product.route.js";
import { v2 as cloudinary } from "cloudinary";
import cartRoute from "./routes/cart.route.js";
import paymentRoute from "./routes/payment.route.js";
import cors from "cors";
dotenv.config();
const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONT_END_LINK, // your frontend origin
    credentials: true, // if you're using cookies or sessions
  })
);
app.use("/api/auth", authRoute);
app.use("/api/products", productRoute);
app.use("/api/cart", cartRoute);
app.use("/api/payments", paymentRoute);

const port = process.env.PORT;
connectDB().then(() => {
  app.listen(port, () => {
    console.log(`App listening on PORT ${port}`);
  });
});
