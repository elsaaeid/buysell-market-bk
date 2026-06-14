const express = require("express");
const { searchByImage, analyzeImage } = require("../controllers/imageSearchController");

const router = express.Router();

// POST /api/image-search - Search products by image
router.post("/search", searchByImage);

// POST /api/image-search/analyze - Analyze image for metadata
router.post("/analyze", analyzeImage);

module.exports = router;
