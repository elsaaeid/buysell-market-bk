const dotenv = require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const errorHandler = require("./middleWare/errorMiddleware");
const cookieParser = require("cookie-parser");
const path = require("path");
const cloudinary = require("cloudinary").v2;
const passport = require('passport');
const session = require('express-session');
const userRoute = require("./routes/userRoute");
const productsRoute = require("./routes/productsRoute");
const paymentRoute = require("./routes/paymentRoute");
const favoriteCompareRoute = require('./routes/favoriteCompareRoute');
const cartRoute = require("./routes/cartRoute");
const couponRoute = require("./routes/couponRoute");
const contactRoute = require("./routes/contactRoute");
const orderRoute = require("./routes/orderRoute");


const app = express();
const PORT = process.env.PORT || 8081;
const mongoUri = process.env.DATABASE;


const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://buysell-market.vercel.app",
];

const isAllowedOrigin = (origin) => {
  if (!origin) {
    return false;
  }

  return allowedOrigins.includes(origin) || origin.endsWith(".vercel.app");
};

const applyCorsHeaders = (req, res) => {
  const requestOrigin = req.headers.origin;

  if (requestOrigin && isAllowedOrigin(requestOrigin)) {
    res.setHeader("Access-Control-Allow-Origin", requestOrigin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, PUT, OPTIONS");
  }
};

// Middlewares
app.use((req, res, next) => {
  applyCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  return next();
});

app.use(cookieParser());
app.use(session({ secret: process.env.JWT_SECRET, resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.json()); // This makes sure Express can parse JSON bodies
// Routes Middleware
app.use("/api/users", userRoute);
app.use("/api/products", productsRoute);
app.use("/api/products", favoriteCompareRoute);
app.use("/api/cart", cartRoute);
app.use("/api/coupon", couponRoute);
app.use("/api/contactus", contactRoute);
app.use("/api/payment", paymentRoute);
app.use("/api/orders", orderRoute);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api", (req, res) => {
  applyCorsHeaders(req, res);
  return res.status(404).json({ message: "API route not found" });
});



cloudinary.config({
  cloud_name : process.env.CLOUD_NAME,//process.env.CLOUDINARY_NAME
  api_key    : process.env.CLOUD_API_KEY,//process.env.CLOUDINARY_API_KEY
  api_secret : process.env.CLOUD_API_SECRET,//process.env.CLOUDINARY_API_SECRET
});



// Routes
app.get("*", (req, res) => {
  applyCorsHeaders(req, res);
  // Add Content Security Policy header
  res.setHeader('Content-Security-Policy', "frame-ancestors 'self' https://www.google.com;");
  res.send("Home Page");
});

// Error Middleware
app.use(errorHandler);
mongoose.set('strictQuery', true);

const connectDatabase = async () => {
  if (!mongoUri) {
    console.warn("No MongoDB URI configured. Set MONGODB_URI or DATABASE before starting the server.");
    return;
  }

  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      minPoolSize: 2,
      maxPoolSize: 10,
    });
    console.log("MongoDB connected");
  } catch (err) {
    console.error("Database connection error:", err.message || err);
    console.error("If this is MongoDB Atlas, make sure the current IP address is whitelisted and the URI credentials are valid.");
  }
};

connectDatabase();

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server Running on port ${PORT}`);
  });
}

module.exports = app;