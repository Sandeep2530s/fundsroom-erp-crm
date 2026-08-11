import { Response } from "express";
import pool from "../db";
import { AuthRequest } from "../middleware/authMiddleware";

export const stockIn = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const client = await pool.connect();

  try {
    const productId = Number(req.body.productId);
    const quantity = Number(req.body.quantity);
    const reason = String(req.body.reason || "").trim();

    if (!Number.isInteger(productId) || productId <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
      return;
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      res.status(400).json({
        success: false,
        message: "Quantity must be a positive integer",
      });
      return;
    }

    if (!reason) {
      res.status(400).json({
        success: false,
        message: "Reason is required",
      });
      return;
    }

    if (!req.user?.userId) {
      res.status(401).json({
        success: false,
        message: "User authentication required",
      });
      return;
    }

    await client.query("BEGIN");

    const productResult = await client.query(
      `SELECT id, current_stock
       FROM products
       WHERE id = $1
       FOR UPDATE`,
      [productId]
    );

    if (productResult.rows.length === 0) {
      await client.query("ROLLBACK");

      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    const currentStock = Number(productResult.rows[0].current_stock);
    const newStock = currentStock + quantity;

    const productUpdate = await client.query(
      `UPDATE products
       SET current_stock = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [newStock, productId]
    );

    const movementResult = await client.query(
      `INSERT INTO stock_movements
       (
         product_id,
         quantity_changed,
         movement_type,
         reason,
         created_by
       )
       VALUES ($1, $2, 'IN', $3, $4)
       RETURNING *`,
      [productId, quantity, reason, req.user.userId]
    );

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Stock added successfully",
      data: {
        product: productUpdate.rows[0],
        movement: movementResult.rows[0],
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Stock IN error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  } finally {
    client.release();
  }
};

export const stockOut = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const client = await pool.connect();

  try {
    const productId = Number(req.body.productId);
    const quantity = Number(req.body.quantity);
    const reason = String(req.body.reason || "").trim();

    if (!Number.isInteger(productId) || productId <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
      return;
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      res.status(400).json({
        success: false,
        message: "Quantity must be a positive integer",
      });
      return;
    }

    if (!reason) {
      res.status(400).json({
        success: false,
        message: "Reason is required",
      });
      return;
    }

    if (!req.user?.userId) {
      res.status(401).json({
        success: false,
        message: "User authentication required",
      });
      return;
    }

    await client.query("BEGIN");

    const productResult = await client.query(
      `SELECT id, current_stock
       FROM products
       WHERE id = $1
       FOR UPDATE`,
      [productId]
    );

    if (productResult.rows.length === 0) {
      await client.query("ROLLBACK");

      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    const currentStock = Number(productResult.rows[0].current_stock);

    if (quantity > currentStock) {
      await client.query("ROLLBACK");

      res.status(400).json({
        success: false,
        message: `Insufficient stock. Available stock: ${currentStock}`,
      });
      return;
    }

    const newStock = currentStock - quantity;

    const productUpdate = await client.query(
      `UPDATE products
       SET current_stock = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [newStock, productId]
    );

    const movementResult = await client.query(
      `INSERT INTO stock_movements
       (
         product_id,
         quantity_changed,
         movement_type,
         reason,
         created_by
       )
       VALUES ($1, $2, 'OUT', $3, $4)
       RETURNING *`,
      [productId, quantity, reason, req.user.userId]
    );

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Stock removed successfully",
      data: {
        product: productUpdate.rows[0],
        movement: movementResult.rows[0],
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Stock OUT error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  } finally {
    client.release();
  }
};

export const getStockMovements = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const productId = req.query.productId
      ? Number(req.query.productId)
      : null;

    const result = await pool.query(
      `SELECT
         sm.id,
         sm.product_id,
         p.product_name,
         p.sku,
         sm.quantity_changed,
         sm.movement_type,
         sm.reason,
         sm.created_by,
         u.email AS created_by_email,
         sm.created_at
       FROM stock_movements sm
       JOIN products p ON p.id = sm.product_id
       JOIN users u ON u.id = sm.created_by
       WHERE ($1::integer IS NULL OR sm.product_id = $1)
       ORDER BY sm.created_at DESC`,
      [productId]
    );

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Get stock movements error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};