const products = require("../data/Products.json");
const product = require("../models/productModel");
const dotenv = require("dotenv");
const connectDatabase = require("../config/database");

dotenv.config({ path: "backend/config/config.env" });

connectDatabase();

const seedProducts = async () => {
  try {
    await product.deleteMany();
    console.log("Products deleted!");
    await product.insertMany(...products);
    console.log("All product added!!");
  } catch (error) {
    console.log(error.message);
  }
  process.exit();
};

seedProducts();
