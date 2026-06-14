const Product = require("../models/productsModel");

// Search products by uploaded/scanned image
// Returns similar products based on category, tags, or metadata
const searchByImage = async (req, res) => {
  try {
    const { imageName, imageCategory, searchText } = req.body;

    if (!imageName && !searchText) {
      return res.status(400).json({ 
        success: false, 
        message: "Image name or search text required" 
      });
    }

    // Extract search terms from image name (e.g., "blue_shoe_nike.jpg" -> "blue", "shoe", "nike")
    const extractTerms = (name) => {
      if (!name) return [];
      return name
        .toLowerCase()
        .replace(/\.[^/.]+$/, '') // Remove extension
        .split(/[-_\s]+/) // Split by separator
        .filter(term => term.length > 2); // Filter short words
    };

    const imageTerms = extractTerms(imageName);
    const searchTerms = extractTerms(searchText) || [];
    const allTerms = [...new Set([...imageTerms, ...searchTerms])]; // Deduplicate

    // Build query to find similar products
    const query = {
      $or: [
        // Match by category
        ...(imageCategory ? [{ category: imageCategory }] : []),
        // Match by product name/title
        {
          $or: [
            { name: { $regex: allTerms.join('|'), $options: 'i' } },
            { title: { $regex: allTerms.join('|'), $options: 'i' } },
            { name_ar: { $regex: allTerms.join('|'), $options: 'i' } },
            { title_ar: { $regex: allTerms.join('|'), $options: 'i' } },
            { model: { $regex: allTerms.join('|'), $options: 'i' } },
            { productType: { $regex: allTerms.join('|'), $options: 'i' } },
          ]
        }
      ]
    };

    const similarProducts = await Product.find(query)
      .limit(20)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: similarProducts.length,
      searchTerms: allTerms,
      products: similarProducts,
    });
  } catch (error) {
    console.error("Image search error:", error);
    res.status(500).json({
      success: false,
      message: "Error searching by image",
      error: error.message,
    });
  }
};

// Get image metadata/analysis (future enhancement with AI service)
const analyzeImage = async (req, res) => {
  try {
    // Placeholder for future AI integration (Google Vision, AWS Rekognition, etc.)
    // For now, we can return basic metadata
    const { imageName } = req.body;

    const metadata = {
      fileName: imageName,
      confidence: 0.8,
      // This would be enhanced with AI service
      suggestedTags: [],
      category: null,
    };

    res.status(200).json({
      success: true,
      metadata,
    });
  } catch (error) {
    console.error("Image analysis error:", error);
    res.status(500).json({
      success: false,
      message: "Error analyzing image",
      error: error.message,
    });
  }
};

module.exports = { searchByImage, analyzeImage };
