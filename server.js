const dotenv = require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const errorHandler = require("./middleWare/errorMiddleware");
const cookieParser = require("cookie-parser");
const cors = require("cors");
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


const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://buysell-market.vercel.app",
  ],
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE", "PUT", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  optionsSuccessStatus: 200,
};

// Custom CORS middleware that handles all origins ending in .vercel.app
const customCors = (req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = corsOptions.origin;
  
  if (origin && (allowedOrigins.includes(origin) || origin.endsWith(".vercel.app"))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", corsOptions.methods.join(", "));
    res.setHeader("Access-Control-Allow-Headers", corsOptions.allowedHeaders.join(", "));
  }

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
};

// Middlewares
app.use(customCors);

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

// Health check endpoint
app.get("/api/health", async (req, res) => {
  try {
    // Check MongoDB connection
    const mongoStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
    
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      mongodb: mongoStatus,
      environment: process.env.NODE_ENV || "development"
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      timestamp: new Date().toISOString(),
      mongodb: "error",
      error: error.message
    });
  }
});

app.use("/api", (req, res) => {
  return res.status(404).json({ message: "API route not found" });
});



cloudinary.config({
  cloud_name : process.env.CLOUD_NAME,//process.env.CLOUDINARY_NAME
  api_key    : process.env.CLOUD_API_KEY,//process.env.CLOUDINARY_API_KEY
  api_secret : process.env.CLOUD_API_SECRET,//process.env.CLOUDINARY_API_SECRET
});



// Routes
app.get("*", (req, res) => {
  // Add Content Security Policy header
  res.setHeader('Content-Security-Policy', "frame-ancestors 'self' https://www.google.com;");
  res.send("Home Page");
});

// Error Middleware
app.use(errorHandler);
mongoose.set('strictQuery', true);

const connectDatabase = async (retries = 3) => {
  if (!mongoUri) {
    console.warn("No MongoDB URI configured. Set MONGODB_URI or DATABASE before starting the server.");
    return;
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`MongoDB connection attempt ${attempt}/${retries}...`);
      await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 5,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000,
        family: 4,
        retryWrites: true,
        retryReads: true,
      });
      console.log("✅ MongoDB connected successfully");
      return;
    } catch (err) {
      console.error(`❌ MongoDB connection attempt ${attempt} failed:`, err.message);
      if (attempt === retries) {
        console.error("💥 All MongoDB connection attempts failed. Server will continue without database connection.");
        console.error("Check MongoDB Atlas IP whitelisting and connection string.");
        return;
      }
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
};

connectDatabase();

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server Running on port ${PORT}`);
  });
}

module.exports = app;