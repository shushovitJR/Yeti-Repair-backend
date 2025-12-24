import { Request, Response } from "express";
import sql from "../config/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  try {
    const result =
      await sql.query`SELECT * FROM users WHERE Username = ${username}`;

    if (result.recordset.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = result.recordset[0];

    // Compare password
    let isMatch = false;
    if (user.Password.startsWith("$2b$")) {
      isMatch = await bcrypt.compare(password, user.Password);
    } else {
      isMatch = password === user.Password;
    }

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Re-hash plain-text password if needed
    if (!user.Password.startsWith("$2b$")) {
      const hashed = await bcrypt.hash(password, 10);
      await sql.query`
        UPDATE users 
        SET Password = ${hashed} 
        WHERE UserId = ${user.UserId}  -- Use exact column name
      `;
    }

    const token = jwt.sign(
      { UserId: user.UserId, Role: user.Role },
      process.env.JWT_SECRET!,
      { expiresIn: "1d" }
    );

    res.json({ 
      token,
      user: user.EmployeeName,
      role: user.Role
    });
  } catch (error) {
    res.status(500).json({ message: "Login Failed" });
  }
};
