import { Router } from "express";
import * as controller from "./categories.controller.js";
import { extensions } from "../../Utils/index.js";
import * as middlewares from "../../Middlewares/index.js";
import { Category } from "../../../DB/Models/index.js";

// Destructure required middlewares
const { errorHandler, getDocumentByName, multerHost } = middlewares;

// Initialize the router
const categoryRouter = Router();

/**
 * @route POST /create
 * @description Create a new category with an image upload
 * @middleware multerHost for handling image upload
 * @middleware getDocumentByName to verify category existence
 * @middleware errorHandler to catch and handle errors
 */
categoryRouter.post(
  "/create",
  multerHost({ allowedExtensions: extensions.Images }).single("image"),
  getDocumentByName(Category),
  errorHandler(controller.createCategory)
);

/**
 * @route GET /
 * @description Retrieve categories based on query parameters (id, name, slug)
 * @middleware errorHandler to catch and handle errors
 */
categoryRouter.get("/", errorHandler(controller.getCategory));

/**
 * @route PUT /update/:_id
 * @description Update an existing category's details
 * @middleware multerHost for handling image upload
 * @middleware getDocumentByName to verify category existence
 * @middleware errorHandler to catch and handle errors
 */
categoryRouter.put(
  "/update/:_id",
  multerHost({ allowedExtensions: extensions.Images }).single("image"),
  getDocumentByName(Category),
  errorHandler(controller.updateCategory)
);

/**
 * @route DELETE /delete/:_id
 * @description Delete a category by ID
 * @middleware errorHandler to catch and handle errors
 */
categoryRouter.delete("/delete/:_id", errorHandler(controller.deleteCategory));

// Export the category router
export { categoryRouter };
