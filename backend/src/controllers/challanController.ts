import { Response } from "express";
import pool from "../db";
import { AuthRequest } from "../middleware/authMiddleware";

export const createChallan = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const client = await pool.connect();

  try {
    const { customerId, items, status = "DRAFT" } = req.body;

    if (!Number.isInteger(Number(customerId)) || Number(customerId) <= 0) {
      res.status(400).json({
        success: false,
        message: "Valid customer ID is required",
      });
      return;
    }

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({
        success: false,
        message: "At least one product is required",
      });
      return;
    }

    if (!["DRAFT", "CONFIRMED"].includes(status)) {
      res.status(400).json({
        success: false,
        message: "Status must be DRAFT or CONFIRMED",
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

    const customerResult = await client.query(
      "SELECT id FROM customers WHERE id = $1",
      [Number(customerId)]
    );

    if (customerResult.rows.length === 0) {
      await client.query("ROLLBACK");

      res.status(404).json({
        success: false,
        message: "Customer not found",
      });
      return;
    }

    const productIds = items.map((item: any) => Number(item.productId));

    if (
      productIds.some(
        (id: number) => !Number.isInteger(id) || id <= 0
      )
    ) {
      await client.query("ROLLBACK");

      res.status(400).json({
        success: false,
        message: "Every item must have a valid product ID",
      });
      return;
    }

    const uniqueProductIds = [...new Set(productIds)];

    if (uniqueProductIds.length !== productIds.length) {
      await client.query("ROLLBACK");

      res.status(400).json({
        success: false,
        message: "A product cannot be added more than once",
      });
      return;
    }

    const productResult = await client.query(
      `SELECT
         id,
         product_name,
         sku,
         unit_price,
         current_stock
       FROM products
       WHERE id = ANY($1::integer[])
       FOR UPDATE`,
      [uniqueProductIds]
    );

    if (productResult.rows.length !== uniqueProductIds.length) {
      await client.query("ROLLBACK");

      res.status(404).json({
        success: false,
        message: "One or more products were not found",
      });
      return;
    }

    const productMap = new Map(
      productResult.rows.map((product) => [product.id, product])
    );

    let totalQuantity = 0;

    for (const item of items) {
      const productId = Number(item.productId);
      const quantity = Number(item.quantity);

      if (!Number.isInteger(quantity) || quantity <= 0) {
        await client.query("ROLLBACK");

        res.status(400).json({
          success: false,
          message: "Each quantity must be a positive integer",
        });
        return;
      }

      const product = productMap.get(productId);

      if (!product) {
        await client.query("ROLLBACK");

        res.status(404).json({
          success: false,
          message: `Product ${productId} not found`,
        });
        return;
      }

      if (
        status === "CONFIRMED" &&
        quantity > Number(product.current_stock)
      ) {
        await client.query("ROLLBACK");

        res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.product_name}. Available stock: ${product.current_stock}`,
        });
        return;
      }

      totalQuantity += quantity;
    }

    /*
     * Prevent two simultaneous challan creations from generating
     * the same challan number.
     */
    await client.query(
      "SELECT pg_advisory_xact_lock($1::bigint)",
      [74839201]
    );

    const challanNumberResult = await client.query(
      `SELECT 'CH-' || LPAD(
         (COALESCE(MAX(id), 0) + 1)::text,
         6,
         '0'
       ) AS challan_number
       FROM challans`
    );

    const challanNumber =
      challanNumberResult.rows[0].challan_number;

    const challanResult = await client.query(
      `INSERT INTO challans
       (
         challan_number,
         customer_id,
         total_quantity,
         status,
         created_by
       )
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        challanNumber,
        Number(customerId),
        totalQuantity,
        status,
        req.user.userId,
      ]
    );

    const challan = challanResult.rows[0];

    for (const item of items) {
      const productId = Number(item.productId);
      const quantity = Number(item.quantity);
      const product = productMap.get(productId);

      await client.query(
        `INSERT INTO challan_items
         (
           challan_id,
           product_id,
           product_name_snapshot,
           sku_snapshot,
           unit_price_snapshot,
           quantity
         )
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          challan.id,
          productId,
          product.product_name,
          product.sku,
          product.unit_price,
          quantity,
        ]
      );

      if (status === "CONFIRMED") {
        await client.query(
          `UPDATE products
           SET current_stock = current_stock - $1,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [quantity, productId]
        );

        await client.query(
          `INSERT INTO stock_movements
           (
             product_id,
             quantity_changed,
             movement_type,
             reason,
             created_by
           )
           VALUES ($1, $2, 'OUT', $3, $4)`,
          [
            productId,
            quantity,
            `Sales challan ${challanNumber}`,
            req.user.userId,
          ]
        );
      }
    }

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message:
        status === "CONFIRMED"
          ? "Sales challan created and stock updated successfully"
          : "Sales challan draft created successfully",
      data: challan,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Create challan error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  } finally {
    client.release();
  }
};

export const getChallans = async (
  _req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const result = await pool.query(
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
       ORDER BY c.created_at DESC`
    );

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Get challans error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getChallanById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const challanId = Number(req.params.id);

    if (!Number.isInteger(challanId) || challanId <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid challan ID",
      });
      return;
    }

    const challanResult = await pool.query(
      `SELECT
         c.id,
         c.challan_number,
         c.customer_id,
         cu.customer_name,
         cu.mobile_number,
         cu.email,
         c.total_quantity,
         c.status,
         c.created_by,
         u.email AS created_by_email,
         c.created_at
       FROM challans c
       JOIN customers cu ON cu.id = c.customer_id
       JOIN users u ON u.id = c.created_by
       WHERE c.id = $1`,
      [challanId]
    );

    if (challanResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "Challan not found",
      });
      return;
    }

    const itemsResult = await pool.query(
      `SELECT
         id,
         product_id,
         product_name_snapshot,
         sku_snapshot,
         unit_price_snapshot,
         quantity,
         created_at
       FROM challan_items
       WHERE challan_id = $1
       ORDER BY id`,
      [challanId]
    );

    res.status(200).json({
      success: true,
      data: {
        ...challanResult.rows[0],
        items: itemsResult.rows,
      },
    });
  } catch (error) {
    console.error("Get challan error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const cancelChallan = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const client = await pool.connect();

  try {
    const challanId = Number(req.params.id);

    if (!Number.isInteger(challanId) || challanId <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid challan ID",
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

    const challanResult = await client.query(
      `SELECT
         id,
         challan_number,
         status
       FROM challans
       WHERE id = $1
       FOR UPDATE`,
      [challanId]
    );

    if (challanResult.rows.length === 0) {
      await client.query("ROLLBACK");

      res.status(404).json({
        success: false,
        message: "Challan not found",
      });
      return;
    }

    const challan = challanResult.rows[0];

    if (challan.status === "CANCELLED") {
      await client.query("ROLLBACK");

      res.status(400).json({
        success: false,
        message: "Challan is already cancelled",
      });
      return;
    }

    const itemsResult = await client.query(
      `SELECT
         product_id,
         quantity
       FROM challan_items
       WHERE challan_id = $1`,
      [challanId]
    );

    if (challan.status === "CONFIRMED") {
      for (const item of itemsResult.rows) {
        await client.query(
          `UPDATE products
           SET current_stock = current_stock + $1,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [item.quantity, item.product_id]
        );

        await client.query(
          `INSERT INTO stock_movements
           (
             product_id,
             quantity_changed,
             movement_type,
             reason,
             created_by
           )
           VALUES ($1, $2, 'IN', $3, $4)`,
          [
            item.product_id,
            item.quantity,
            `Cancelled challan ${challan.challan_number}`,
            req.user.userId,
          ]
        );
      }
    }

    const updateResult = await client.query(
      `UPDATE challans
       SET status = 'CANCELLED'
       WHERE id = $1
       RETURNING *`,
      [challanId]
    );

    await client.query("COMMIT");

    res.status(200).json({
      success: true,
      message: "Challan cancelled successfully",
      data: updateResult.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Cancel challan error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  } finally {
    client.release();
  }
};