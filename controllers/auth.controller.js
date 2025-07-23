import User from "./../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { redis } from "../lib/redis.js";
import { emailTransporter } from "../lib/emailTransporter.js";
import crypto from "crypto";

const generateToken = (id) => {
  const accessToken = jwt.sign({ id }, process.env.ACCESS_JWT_SECRET, {
    expiresIn: "30d",
  });

  return { accessToken };
};

const setCookies = async (res, accessToken) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: true,
    // secure: process.env.NODE_ENV === "production",
    sameSite: "none",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
};
export const Signup = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        message: "User with email already exists",
      });
    }
    const hashPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      email,
      password: hashPassword,
    });
    await newUser.save();
    const { accessToken } = generateToken(newUser._id);

    setCookies(res, accessToken);

    res.status(200).json({
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
      message: "User created successfully",
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const errors = {};
      for (const field in error.errors) {
        errors[field] = error.errors[field].message;
      }

      return res.status(400).json({ errors });
    }
    res.status(500).json({ message: "Internal server error " + error.message });
  }
};

export const Login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(403).json({
        message: "User not exists",
      });
    }
    const isValid = await bcrypt.compare(password, user?.password);
    if (!isValid) {
      return res.status(400).json({
        message: "Passwords is incorrect",
      });
    }
    const { accessToken } = generateToken(user._id);
    setCookies(res, accessToken);
    res.status(200).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error " + error.message });
  }
};
export const Logout = async (req, res) => {
  try {
    res.cookie("accessToken", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error " + error.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: "User not exists",
      });
    }
    const resetToken = crypto.randomBytes(32).toString("hex");

    const resetTokenExpiry = Date.now() + 15 * 60 * 1000;
    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();
    const resetLink = `${process.env.FRONT_END_LINK}/reset-password/${resetToken}`;
    emailTransporter(email, resetLink);
    res.status(200).json({
      message: "Your reset Password link has been sent to your email",
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error " + error.message,
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;
    const { resetToken } = req.params;
    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match",
      });
    }
    const user = await User.findOne({
      resetToken,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired reset token",
      });
    }

    const email = user.email;
    const hashPassword = await bcrypt.hash(password, 10);
    user.password = hashPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.status(200).json({
      message: "Password reset successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error resetting password : " + error.message,
    });
  }
};

export const adminRoute = async (req, res, next) => {
  try {
    if (req.user && req.user.role == "admin") next();
    else {
      res.status(401).json({
        message: "Access denied - Admin only",
      });
    }
  } catch (e) {
    res.status(500).json({
      message: "Internal server error " + error.message,
    });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = req.user;
    res.status(201).json(user);
  } catch (e) {
    res.status(500).json({
      message: "Internal server error " + error.message,
    });
  }
};
