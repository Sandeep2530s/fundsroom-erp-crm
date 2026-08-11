import { Response } from "express";
import pool from "../db";
import { AuthRequest } from "../middleware/authMiddleware";

export const getLowStockProducts = async (
  _req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT
         id,
         product_name,
         sku,
         category,
         unit_price,
         current_stock,
         minimum_stock_alert_quantity,
         warehouse_location
       FROM products
       WHERE current_stock <= minimum_stock_alert_quantity
       ORDER BY current_stock ASC, product_name ASC`
    );

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Low stock alert error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};