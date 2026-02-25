import { Request, Response } from "express";
import db from "../config/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  try {
    const result = await db.query(
      `
        SELECT
          UserId AS "UserId",
          Username AS "Username",
          Password AS "Password",
          Role AS "Role",
          EmployeeName AS "EmployeeName"
        FROM users
        WHERE Username = $1
      `,
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = result.rows[0];

    if (user.Username !== username){
      return res.status(401).json({ message:"Username or Password is incorrect" })
    }

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
      await db.query("UPDATE users SET Password = $1 WHERE UserId = $2", [
        hashed,
        user.UserId,
      ]);
    }

    const token = jwt.sign(
      { UserId: user.UserId, Role: user.Role },
      process.env.JWT_SECRET!,
      { expiresIn: "30d" }
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
