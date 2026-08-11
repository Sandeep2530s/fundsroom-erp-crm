import { Response } from "express";
import pool from "../db";
import { AuthRequest } from "../middleware/authMiddleware";

export const addProduct = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      productName,
      sku,
      category,
      unitPrice,
      currentStock,
      minStockAlert,
      location,
    } = req.body;

    if (
      !productName ||
      !sku ||
      !category ||
      unitPrice === undefined ||
      currentStock === undefined ||
      minStockAlert === undefined ||
      !location
    ) {
      res.status(400).json({
        success: false,
        message:
          "Product name, SKU, category, unit price, current stock, minimum stock alert and location are required",
      });
      return;
    }

    if (
      Number(unitPrice) < 0 ||
      Number(currentStock) < 0 ||
      Number(minStockAlert) < 0
    ) {
      res.status(400).json({
        success: false,
        message: "Price and stock values cannot be negative",
      });
      return;
    }

    const existingProduct = await pool.query(
      "SELECT id FROM products WHERE sku = $1",
      [sku]
    );

    if (existingProduct.rows.length > 0) {
      res.status(409).json({
        success: false,
        message: "SKU already exists",
      });
      return;
    }

    const result = await pool.query(
      `INSERT INTO products
       (
         product_name,
         sku,
         category,
         unit_price,
         current_stock,
         minimum_stock_alert_quantity,
         warehouse_location
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [
        productName,
        sku,
        category,
        Number(unitPrice),
        Number(currentStock),
        Number(minStockAlert),
        location,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Add product error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getProducts = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const search = String(req.query.search || "");
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(
      Math.max(Number(req.query.limit) || 10, 1),
      100
    );
    const offset = (page - 1) * limit;

    const searchPattern = `%${search}%`;

    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM products
       WHERE product_name ILIKE $1
          OR sku ILIKE $1
          OR category ILIKE $1`,
      [searchPattern]
    );

    const result = await pool.query(
      `SELECT *
       FROM products
       WHERE product_name ILIKE $1
          OR sku ILIKE $1
          OR category ILIKE $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [searchPattern, limit, offset]
    );

    const total = countResult.rows[0].total;

    res.status(200).json({
      success: true,
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get products error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getProductById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const productId = Number(req.params.id);

    if (!Number.isInteger(productId) || productId <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
      return;
    }

    const result = await pool.query(
      "SELECT * FROM products WHERE id = $1",
      [productId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Get product error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateProduct = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const productId = Number(req.params.id);

    if (!Number.isInteger(productId) || productId <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
      return;
    }

    const {
      productName,
      sku,
      category,
      unitPrice,
      currentStock,
      minStockAlert,
      location,
    } = req.body;

    if (
      !productName ||
      !sku ||
      !category ||
      unitPrice === undefined ||
      currentStock === undefined ||
      minStockAlert === undefined ||
      !location
    ) {
      res.status(400).json({
        success: false,
        message:
          "Product name, SKU, category, unit price, current stock, minimum stock alert and location are required",
      });
      return;
    }

    if (
      Number(unitPrice) < 0 ||
      Number(currentStock) < 0 ||
      Number(minStockAlert) < 0
    ) {
      res.status(400).json({
        success: false,
        message: "Price and stock values cannot be negative",
      });
      return;
    }

    const duplicateSku = await pool.query(
      "SELECT id FROM products WHERE sku = $1 AND id <> $2",
      [sku, productId]
    );

    if (duplicateSku.rows.length > 0) {
      res.status(409).json({
        success: false,
        message: "SKU already exists",
      });
      return;
    }

    const result = await pool.query(
      `UPDATE products
       SET
         product_name = $1,
         sku = $2,
         category = $3,
         unit_price = $4,
         current_stock = $5,
         minimum_stock_alert_quantity = $6,
         warehouse_location = $7,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING *`,
      [
        productName,
        sku,
        category,
        Number(unitPrice),
        Number(currentStock),
        Number(minStockAlert),
        location,
        productId,
      ]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Update product error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};