import { Router } from "express";
// Controllers
import * as controller from "./brands.controller.js";
// Middlewares
import * as Middlewares from "../../Middlewares/index.js";
// Utils
import { extensions } from "../../Utils/index.js";

// Initialize the router for brand routes
const brandRouter = Router();
const { errorHandler, multerHost } = Middlewares;

/**
 * @route POST /create
 * @description Create a new brand. Expects an image file and brand details.
 * @middleware multerHost - Handles file upload with allowed image extensions.
 * @middleware errorHandler - Handles errors for the createBrand controller.
 */
brandRouter.post(
  "/create",
  multerHost({ allowedExtensions: extensions.Images }).single("image"),
  errorHandler(controller.createBrand)
);

/**
 * @route GET /
 * @description Retrieve brands based on query parameters.
 * @middleware errorHandler - Handles errors for the getBrands controller.
 */
brandRouter.get("/", errorHandler(controller.getBrands));

/**
 * @route PUT /update/:_id
 * @description Update an existing brand's details and optionally its image.
 * @middleware multerHost - Handles file upload with allowed image extensions.
 * @middleware errorHandler - Handles errors for the updateBrand controller.
 */
brandRouter.put(
  "/update/:_id",
  multerHost({ allowedExtensions: extensions.Images }).single("image"),
  errorHandler(controller.updateBrand)
);

/**
 * @route DELETE /delete/:_id
 * @description Delete an existing brand by its ID.
 * @middleware errorHandler - Handles errors for the deleteBrand controller.
 */
brandRouter.delete("/delete/:_id", errorHandler(controller.deleteBrand));

export { brandRouter };
