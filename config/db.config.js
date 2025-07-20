import mongoose from "mongoose";

const connectDB = async () => {
  try {
    mongoose.set("strictQuery", false);

    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MONGO DB connected  to ${conn.connection.host}`);
  } catch (e) {
    console.error("Error in connecting db ", error);
    process.exit(1);
  }
};

export default connectDB;
