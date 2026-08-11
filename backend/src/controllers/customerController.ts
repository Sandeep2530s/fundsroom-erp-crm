import { Response } from "express";
import pool from "../db";
import { AuthRequest } from "../middleware/authMiddleware";

export const addCustomer = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      customerName,
      mobileNumber,
      email,
      businessName,
      gstNumber,
      customerType,
      address,
      status,
      followUpDate,
      notes,
    } = req.body;

    if (
      !customerName ||
      !mobileNumber ||
      !businessName ||
      !customerType ||
      !address
    ) {
      res.status(400).json({
        success: false,
        message:
          "Customer name, mobile number, business name, customer type and address are required",
      });
      return;
    }

    const validTypes = ["RETAIL", "WHOLESALE", "DISTRIBUTOR"];

    if (!validTypes.includes(customerType)) {
      res.status(400).json({
        success: false,
        message: "Invalid customer type",
      });
      return;
    }

    const validStatuses = ["LEAD", "ACTIVE", "INACTIVE"];
    const customerStatus = status || "LEAD";

    if (!validStatuses.includes(customerStatus)) {
      res.status(400).json({
        success: false,
        message: "Invalid customer status",
      });
      return;
    }

    const result = await pool.query(
      `INSERT INTO customers
       (
         customer_name,
         mobile_number,
         email,
         business_name,
         gst_number,
         customer_type,
         address,
         status,
         follow_up_date,
         notes
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        customerName,
        mobileNumber,
        email || null,
        businessName,
        gstNumber || null,
        customerType,
        address,
        customerStatus,
        followUpDate || null,
        notes || null,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Add customer error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getCustomers = async (
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
       FROM customers
       WHERE customer_name ILIKE $1
          OR mobile_number ILIKE $1
          OR business_name ILIKE $1`,
      [searchPattern]
    );

    const result = await pool.query(
      `SELECT *
       FROM customers
       WHERE customer_name ILIKE $1
          OR mobile_number ILIKE $1
          OR business_name ILIKE $1
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
    console.error("Get customers error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getCustomerById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const customerId = Number(req.params.id);

    if (!Number.isInteger(customerId) || customerId <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
      return;
    }

    const result = await pool.query(
      "SELECT * FROM customers WHERE id = $1",
      [customerId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "Customer not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Get customer error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateCustomer = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const customerId = Number(req.params.id);

    if (!Number.isInteger(customerId) || customerId <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
      return;
    }

    const {
      customerName,
      mobileNumber,
      email,
      businessName,
      gstNumber,
      customerType,
      address,
      status,
      followUpDate,
      notes,
    } = req.body;

    if (
      !customerName ||
      !mobileNumber ||
      !businessName ||
      !customerType ||
      !address
    ) {
      res.status(400).json({
        success: false,
        message:
          "Customer name, mobile number, business name, customer type and address are required",
      });
      return;
    }

    const validTypes = ["RETAIL", "WHOLESALE", "DISTRIBUTOR"];
    const validStatuses = ["LEAD", "ACTIVE", "INACTIVE"];

    if (!validTypes.includes(customerType)) {
      res.status(400).json({
        success: false,
        message: "Invalid customer type",
      });
      return;
    }

    if (!validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        message: "Invalid customer status",
      });
      return;
    }

    const result = await pool.query(
      `UPDATE customers
       SET
         customer_name = $1,
         mobile_number = $2,
         email = $3,
         business_name = $4,
         gst_number = $5,
         customer_type = $6,
         address = $7,
         status = $8,
         follow_up_date = $9,
         notes = $10,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $11
       RETURNING *`,
      [
        customerName,
        mobileNumber,
        email || null,
        businessName,
        gstNumber || null,
        customerType,
        address,
        status,
        followUpDate || null,
        notes || null,
        customerId,
      ]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "Customer not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Update customer error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const addFollowUpNote = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const customerId = Number(req.params.id);
    const { note } = req.body;

    if (!Number.isInteger(customerId) || customerId <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
      return;
    }

    if (!note || !String(note).trim()) {
      res.status(400).json({
        success: false,
        message: "Follow-up note is required",
      });
      return;
    }

    const existingCustomer = await pool.query(
      "SELECT notes FROM customers WHERE id = $1",
      [customerId]
    );

    if (existingCustomer.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "Customer not found",
      });
      return;
    }

    const currentNotes = existingCustomer.rows[0].notes || "";

    const updatedNotes = currentNotes
      ? `${currentNotes}\n${new Date().toISOString()} - ${String(note).trim()}`
      : `${new Date().toISOString()} - ${String(note).trim()}`;

    const result = await pool.query(
      `UPDATE customers
       SET notes = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [updatedNotes, customerId]
    );

    res.status(200).json({
      success: true,
      message: "Follow-up note added successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Add follow-up note error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};