import express from "express";
import { config } from "dotenv";

// Middlewares
import { globaleResponse } from "./src/Middlewares/index.js";
// Database connection
import db_connection from "./DB/connection.js";
// Routers
import * as router from "./src/Modules/index.js";

// Load environment variables from .env file
config();

// Initialize Express app
const app = express();
const port = process.env.PORT || 5000;

// Middleware to parse JSON bodies
app.use(express.json());

// Register routes
app.use("/categories", router.categoryRouter);
app.use("/sub-categories", router.subCategoryRouter);
app.use("/brands", router.brandRouter);
app.use("/products", router.productRouter);

// Global error handler middleware
app.use(globaleResponse);

// Establish database connection
db_connection();

// Start the server
app.listen(port, () => console.log(`Server listening on port ${port}!`));
