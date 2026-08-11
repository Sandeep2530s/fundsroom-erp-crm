import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import pool from "./db";

dotenv.config();

const users = [
  {
    name: "System Administrator",
    email: "admin@fundsroom.com",
    password: "Admin@123",
    role: "ADMIN",
  },
  {
    name: "Sales User",
    email: "sales@fundsroom.com",
    password: "Sales@123",
    role: "SALES",
  },
  {
    name: "Warehouse User",
    email: "warehouse@fundsroom.com",
    password: "Warehouse@123",
    role: "WAREHOUSE",
  },
  {
    name: "Accounts User",
    email: "accounts@fundsroom.com",
    password: "Accounts@123",
    role: "ACCOUNTS",
  },
];

const seedUsers = async () => {
  try {
    for (const user of users) {
      const passwordHash = await bcrypt.hash(user.password, 10);

      await pool.query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) DO NOTHING`,
        [user.name, user.email, passwordHash, user.role]
      );
    }

    console.log("Test users created successfully");
  } catch (error) {
    console.error("Error creating test users:", error);
  } finally {
    await pool.end();
  }
};

seedUsers();