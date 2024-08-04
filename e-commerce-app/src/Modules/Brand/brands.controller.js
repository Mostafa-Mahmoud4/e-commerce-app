import slugify from "slugify";
import { nanoid } from "nanoid";
import { SubCategory, Brand } from "../../../DB/Models/index.js";

import { cloudinaryConfig, ErrorClass, uploadFile } from "../../Utils/index.js";

/**
 * @api {post} /brands/create Create a brand
 * @description Creates a new brand under a specified subcategory and category.
 */
export const createBrand = async (req, res, next) => {
  const { category, subCategory } = req.query;

  // Check if the specified subcategory exists within the given category
  const isSubcategoryExist = await SubCategory.findOne({
    _id: subCategory,
    categoryId: category,
  }).populate("categoryId");

  if (!isSubcategoryExist) {
    return next(
      new ErrorClass("Subcategory not found", 404, "Subcategory not found")
    );
  }

  // Generate a slug for the brand name
  const { name } = req.body;
  const slug = slugify(name, {
    replacement: "_",
    lower: true,
  });

  // Check if an image file is provided
  if (!req.file) {
    return next(
      new ErrorClass("Please upload an image", 400, "Please upload an image")
    );
  }

  // Upload the image to Cloudinary
  const customId = nanoid(4);
  const { secure_url, public_id } = await uploadFile({
    file: req.file.path,
    folder: `${process.env.UPLOADS_FOLDER}/Categories/${isSubcategoryExist.categoryId.customId}/SubCategories/${isSubcategoryExist.customId}/Brands/${customId}`,
  });

  // Prepare the brand object
  const brand = {
    name,
    slug,
    logo: {
      secure_url,
      public_id,
    },
    customId,
    categoryId: isSubcategoryExist.categoryId._id,
    subCategoryId: isSubcategoryExist._id,
  };

  // Create the brand in the database
  const newBrand = await Brand.create(brand);

  // Send the response with the newly created brand
  res.status(201).json({
    status: "success",
    message: "Brand created successfully",
    data: newBrand,
  });
};

/**
 * @api {GET} /brands Get brands by query parameters
 * @description Retrieves a brand by ID, name, or slug.
 */
export const getBrands = async (req, res, next) => {
  const { id, name, slug } = req.query;
  const queryFilter = {};

  // Build query filter based on provided parameters
  if (id) queryFilter._id = id;
  if (name) queryFilter.name = name;
  if (slug) queryFilter.slug = slug;

  // Find the brand using the query filter
  const brand = await Brand.findOne(queryFilter);

  if (!brand) {
    return next(new ErrorClass("Brand not found", 404, "Brand not found"));
  }

  // Send the response with the found brand
  res.status(200).json({
    status: "success",
    message: "Brand found",
    data: brand,
  });
};

/**
 * @api {PUT} /brands/update/:_id Update a brand
 * @description Updates a brand's details including name and logo.
 */
export const updateBrand = async (req, res, next) => {
  const { _id } = req.params;
  const { name } = req.body;

  // Find the brand by ID
  const brand = await Brand.findById(_id)
    .populate("categoryId")
    .populate("subCategoryId");

  if (!brand) {
    return next(
      new ErrorClass("Brand not found", 404, "Brand not found")
    );
  }

  // Update the brand's name and slug if provided
  if (name) {
    const slug = slugify(name, {
      replacement: "_",
      lower: true,
    });
    brand.name = name;
    brand.slug = slug;
  }

  // Update the brand's logo if a new file is provided
  if (req.file) {
    const splitedPublicId = brand.logo.public_id.split(`${brand.customId}/`)[1];
    const { secure_url } = await uploadFile({
      file: req.file.path,
      folder: `${process.env.UPLOADS_FOLDER}/Categories/${brand.categoryId.customId}/SubCategories/${brand.subCategoryId.customId}/Brands/${brand.customId}`,
      publicId: splitedPublicId,
    });
    brand.logo.secure_url = secure_url;
  }

  // Save the updated brand to the database
  await brand.save();

  // Send the response with the updated brand
  res.status(200).json({
    status: "success",
    message: "Brand updated successfully",
    data: brand,
  });
};

/**
 * @api {DELETE} /brands/delete/:_id Delete a brand
 * @description Deletes a brand and its associated resources.
 */
export const deleteBrand = async (req, res, next) => {
  const { _id } = req.params;

  // Find and delete the brand by ID
  const brand = await Brand.findByIdAndDelete(_id)
    .populate("categoryId")
    .populate("subCategoryId");

  if (!brand) {
    return next(new ErrorClass("Brand not found", 404, "Brand not found"));
  }

  // Delete the associated image from Cloudinary
  const brandPath = `${process.env.UPLOADS_FOLDER}/Categories/${brand.categoryId.customId}/SubCategories/${brand.subCategoryId.customId}/Brands/${brand.customId}`;
  await cloudinaryConfig().api.delete_resources_by_prefix(brandPath);
  await cloudinaryConfig().api.delete_folder(brandPath);

  // Note: Consider deleting related products from the database
  // @todo Implement logic to delete related products from the database

  // Send the response confirming deletion
  res.status(200).json({
    status: "success",
    message: "Brand deleted successfully",
  });
};
