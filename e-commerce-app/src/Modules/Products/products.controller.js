import { nanoid } from "nanoid";
import slugify from "slugify";
import { Product } from "../../../DB/Models/index.js";
import {calculateProductPrice, ErrorClass, uploadFile} from "../../Utils/index.js";

/**
 * @api {POST} /products/add  Add Product
 * @description Adds a new product to the database.
 */
export const addProduct = async (req, res, next) => {
  const { title, overview, specs, price, discountAmount, discountType, stock } = req.body;

  // Check if images are uploaded
  if (!req.files.length) {
    return next(new ErrorClass("No images uploaded", { status: 400 }));
  }

  // Retrieve brand and associated document information
  const brandDocument = req.document;
  const brandCustomId = brandDocument.customId;
  const categoryCustomId = brandDocument.categoryId.customId;
  const subCategoryCustomId = brandDocument.subCategoryId.customId;

  // Generate a unique ID for the product
  const customId = nanoid(4);
  const folder = `${process.env.UPLOADS_FOLDER}/Categories/${categoryCustomId}/SubCategories/${subCategoryCustomId}/Brands/${brandCustomId}/Products/${customId}`;

  // Upload images to Cloudinary and store their URLs and public IDs
  const URLs = [];
  for (const file of req.files) {
    const { secure_url, public_id } = await uploadFile({
      file: file.path,
      folder,
    });
    URLs.push({ secure_url, public_id });
  }

  // Create a product object to be saved in the database
  const productObject = {
    title,
    overview,
    specs: JSON.parse(specs),
    price,
    appliedDiscount: {
      amount: discountAmount,
      type: discountType,
    },
    stock,
    Images: {
      URLs,
      customId,
    },
    categoryId: brandDocument.categoryId._id,
    subCategoryId: brandDocument.subCategoryId._id,
    brandId: brandDocument._id,
  };

  // Save the new product in the database
  const newProduct = await Product.create(productObject);

  // Respond with the created product data
  res.status(201).json({
    status: "success",
    message: "Product created successfully",
    data: newProduct,
  });
};

/**
 * @api {PUT} /products/update/:productId  Update Product
 * @description Updates an existing product's details.
 */
export const updateProduct = async (req, res, next) => {
  const { productId } = req.params;
  const { title, stock, overview, badge, price, discountAmount, discountType, specs } = req.body;

  // Find the product by ID
  const product = await Product.findById(productId);
  if (!product) {
    return next(new ErrorClass("Product not found", { status: 404 }));
  }

  // Update product details
  if (title) {
    product.title = title;
    product.slug = slugify(title, {
      replacement: "_",
      lower: true,
    });
  }

  if (stock) product.stock = stock;
  if (overview) product.overview = overview;
  if (badge) product.badge = badge;

  if (price || discountAmount || discountType) {
    const newPrice = price || product.price;
    const discount = {
      amount: discountAmount || product.appliedDiscount.amount,
      type: discountType || product.appliedDiscount.type,
    };

    product.appliedPrice = calculateProductPrice(newPrice, discount);
    product.price = newPrice;
    product.appliedDiscount = discount;
  }

  // Update product specifications
  if (specs) product.specs = JSON.parse(specs);

  // Save the updated product
  await product.save();

  // Respond with the updated product data
  res.status(200).json({
    status: "success",
    message: "Product updated successfully",
    data: product,
  });
};

/**
 * @api {GET} /products/list  List all Products
 * @description Lists all products with pagination.
 */
export const listProducts = async (req, res, next) => {
  const { page = 1, limit = 5 } = req.query;
  const skip = (page - 1) * limit;

  // Find all products with pagination
  const products = await Product.paginate(
    {
      appliedPrice: { $gte: 20000 },
    },
    {
      page,
      limit,
      skip,
      select: "-Images -specs -categoryId -subCategoryId -brandId",
      sort: { appliedPrice: 1 },
    }
  );

  // Respond with the list of products
  res.status(200).json({
    status: "success",
    message: "Products list",
    data: products,
  });
};
