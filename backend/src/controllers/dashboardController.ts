import { Response } from "express";
import pool from "../db";
import { AuthRequest } from "../middleware/authMiddleware";

export const getDashboardSummary = async (
  _req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const [
      customersResult,
      productsResult,
      stockResult,
      lowStockResult,
      movementsResult,
      recentCustomersResult,
      recentChallansResult,
    ] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int AS total
         FROM customers`
      ),

      pool.query(
        `SELECT COUNT(*)::int AS total
         FROM products`
      ),

      pool.query(
        `SELECT COALESCE(SUM(current_stock), 0)::int AS total
         FROM products`
      ),

      pool.query(
        `SELECT COUNT(*)::int AS total
         FROM products
         WHERE current_stock <= minimum_stock_alert_quantity`
      ),

      pool.query(
        `SELECT
           sm.id,
           sm.product_id,
           p.product_name,
           p.sku,
           sm.quantity_changed,
           sm.movement_type,
           sm.reason,
           u.email AS created_by_email,
           sm.created_at
         FROM stock_movements sm
         JOIN products p ON p.id = sm.product_id
         JOIN users u ON u.id = sm.created_by
         ORDER BY sm.created_at DESC
         LIMIT 5`
      ),

      pool.query(
        `SELECT
           id,
           customer_name,
           mobile_number,
           email,
           business_name,
           customer_type,
           status,
           created_at
         FROM customers
         ORDER BY created_at DESC
         LIMIT 5`
      ),

      pool.query(
        `SELECT
           c.id,
           c.challan_number,
           c.customer_id,
           cu.customer_name,
           c.total_quantity,
           c.status,
           c.created_by,
           u.email AS created_by_email,
           c.created_at
         FROM challans c
         JOIN customers cu ON cu.id = c.customer_id
         JOIN users u ON u.id = c.created_by
         ORDER BY c.created_at DESC
         LIMIT 5`
      ),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalCustomers: customersResult.rows[0].total,
        totalProducts: productsResult.rows[0].total,
        totalStock: stockResult.rows[0].total,
        lowStockCount: lowStockResult.rows[0].total,
        recentStockMovements: movementsResult.rows,
        recentCustomers: recentCustomersResult.rows,
        recentChallans: recentChallansResult.rows,
      },
    });
  } catch (error) {
    console.error("Dashboard summary error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};