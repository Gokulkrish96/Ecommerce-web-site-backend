const Product = require("../models/productModel");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncError = require("../middlewares/catchAsyncError");
const APIFeatures = require("../utils/apiFeatures");

//get Products - /api/v1/products/
exports.getProducts = catchAsyncError(async (req, res, next) => {
  const resPerPage = 3;

  let buildQuery = () => {
    return new APIFeatures(Product.find(), req.query).search().filter();
  };

  const filteredProductsCount = await buildQuery().query.countDocuments({});
  const totalProductsCount = await Product.countDocuments({});

  let productsCount = totalProductsCount;

  if (filteredProductsCount !== totalProductsCount) {
    productsCount = filteredProductsCount;
  }
  const products = await buildQuery().paginate(resPerPage).query;

  res.status(200).json({
    success: true,
    count: productsCount,
    products,
    resPerPage,
  });
});

//Create Product - /api/v1/product/new
exports.newProduct = catchAsyncError(async (req, res, next) => {

  let images = []
  if(req.files.length > 0) {
    req.files.forEach( file => {
        let url = `${process.env.BACKEND_URL}/uploads/product/${file.originalname}`;
        images.push({ image: url })
    })
}

req.body.images = images;

  req.body.user = req.user.id;
  const products = await Product.create(req.body);

  res.status(201).json({
    success: true,
    products,
  });
});

// get single product -{{base_url}}/api/v1/product/id

exports.getSingleProduct = catchAsyncError(async (req, res, next) => {
  const product = await Product.findById(req.params.id).populate('reviews.user','name email');

  if (!product) {
    return next(new ErrorHandler("Product not found ", 400));
  }
  res.status(201).json({
    success: true,
    product,
  });
});

//update product - {{base_url}}/api/v1/product/id

exports.updateProduct = catchAsyncError(async (req, res, next) => {
  let product = await Product.findById(req.params.id);

//uploading images

  let images = []

  //if images not cleared we keep existing images

  if(req.body.imagesCleared === 'false'){
      images = product.images;

  }
  if(req.files.length > 0) {
    req.files.forEach( file => {
        let url = `${process.env.BACKEND_URL}/uploads/product/${file.originalname}`;
        images.push({ image: url })
    })
}

req.body.images = images;

  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found",
    });
  }
  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    product,
  });
});

// Delete product - {{base_url}}/api/v1/product/id

exports.deleteProduct = catchAsyncError(async (req, res, next) => {
  const product = await Product.findByIdAndDelete(req.params.id);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found",
    });
  }

  res.status(200).json({
    success: true,
    message: "Product Deleted!",
  });
});

//Create Review - api/v1/review

exports.createReview = catchAsyncError(async (req, res, next) => {
  const { productId, rating, comment } = req.body;

  const review = {
    user: req.user.id,
    rating,
    comment,
  };

  const product = await Product.findById(productId);
  //finding user review exists
  const isReviewed = product.reviews.find((review) => {
    return review.user.toString() == req.user.id.toString();
  });

  //finding user already has reviewed
  if (isReviewed) {
    product.reviews.forEach((review) => {
      if (review.user.toString() == req.user.id.toString()) {
        review.comment = comment;
        review.rating = rating;
      }
    });
  } else {
    product.reviews.push(review);
    product.numOfReviews = product.reviews.length;
  }
  //find the average of the product reviews
  product.ratings =
    product.reviews.reduce((acc, review) => {
      return review.rating + acc;
    }, 0) / product.reviews.length;

  product.ratings = isNaN(product.ratings) ? 0 : product.ratings;
  await product.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
  });
});

//Get Review - api/v1/reviews?id={product id}

exports.getReviews = catchAsyncError(async (req, res, next) => {
  const product = await Product.findById(req.query.id).populate('reviews.user','name email');

  res.status(200).json({
    success: true,
    reviews: product.reviews,
  });
});

//Delete Review - api/v1/review

exports.deleteReview = catchAsyncError(async (req, res, next) => {
  const product = await Product.findById(req.query.productId);

  //filltering the reviews which does not match the deleting review id
  const reviews = product.reviews.filter((review) => {
    return review._id.toString() !== req.query.id.toString();
  });

  //number of reviews
  const numOfReviews = reviews.length;

  //finding the average with the filleterd reviews
  let ratings =
    reviews.reduce((acc, review) => {
      return review.rating + acc;
    }, 0) / reviews.length;

  ratings = isNaN(ratings) ? 0 : ratings;

  // save in the product document
  await Product.findByIdAndUpdate(req.query.productId, {
    reviews,
    numOfReviews,
    ratings,
  });

  res.status(200).json({
    success: true,
  });
});



//get admin products - api/v1/admin/products

exports.getAdminProducts = catchAsyncError(async (req, res, next) => {

    const products = await Product.find();

    res.status(200).send({
      success:true,
      products
    }
    )


})