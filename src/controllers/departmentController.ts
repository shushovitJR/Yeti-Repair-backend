import { Request, Response } from "express";
import db from "../config/db";

export const addDepartment = async (req: Request, res: Response) => {
  const { DepartmentName } = req.body;
  if (!DepartmentName) {
    return res.status(400).json({
      message: "Department Name is required",
    });
  }
  try {
    const result = await db.query(
      `
        INSERT INTO department (DepartmentName)
        VALUES ($1)
        RETURNING DepartmentId AS "DepartmentId";
      `,
      [DepartmentName]
    );

    const newDepartmentId = result.rows[0]?.DepartmentId;

    res.status(201).json({
      message: "Request Created Successfully",
      DepartmentId: newDepartmentId,
    });
  } catch (error: any) {
    console.error("Error creating department:", error);
    res.status(500).json({
      message: "Failed to create department",
    });
  }
};

export const getDepartments = async (req: Request, res: Response) => {
  try {
    const result = await db.query(`
      SELECT
        DepartmentId AS "DepartmentId",
        DepartmentName AS "DepartmentName"
      FROM department;
    `);

    const department = result.rows.map((row: any) => ({
      DepartmentId: row.DepartmentId,
      DepartmentName: row.DepartmentName,
    }));

    res.status(200).json(department);
  } catch (error: any) {
    console.error("Error fetching department from db:", error);
    res.status(500).json({
      message: "Failed to fetch department from db",
    });
  }
};

export const deleteDepartment = async (req: Request, res: Response) => {
  const { id } = req.params;
  const departmentId = Number(id);

  if (isNaN(departmentId) || departmentId <= 0) {
    return res.status(400).json({ message: "Invalid Department ID" });
  }

  try {
    const deleteQuery = `
        DELETE FROM department
        WHERE DepartmentId = $1`;
    const deleteResult = await db.query(deleteQuery, [departmentId]);

    if (deleteResult.rowCount === 0) {
      return res.status(404).json({ message: "Department not found" });
    }

    res.status(200).json({
      message: "Department deleted successfully",
      departmentId,
    });
  } catch (error: any) {
    console.error("Error deleting department:", error);
    res.status(500).json({ message: "Failed to delete department" });
  }
};

export const updateDepartment = async (req: Request, res: Response) => {  
  const { id } = req.params;
  const DepartmentId = Number(id);

  if (isNaN(DepartmentId) || DepartmentId < 0) {
    return res.status(400).json({ message: "The department id is invalid" });
  }

  const { DepartmentName } = req.body;

  if (DepartmentName === undefined) {
    return res
      .status(400)
      .json({ message: "Department name field is not provided" });
  }

  try {
    let updateQuery = "UPDATE department SET ";
    const updates: string[] = [];
    const values: any[] = [];
    let index = 1;

    if (DepartmentName !== undefined) {
      updates.push(`DepartmentName=$${index++}`);
      values.push(DepartmentName);
    }

    updateQuery += updates.join(", ");
    updateQuery += ` WHERE DepartmentId = $${index}`;
    values.push(DepartmentId);

    const result = await db.query(updateQuery, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Department not found" });
    }

    res.status(200).json({
      message: "Department updated successfully",
      DepartmentId,
    });
  } catch (error: any) {
    console.error("Failed Updating Department", error);
    res.status(500).json({ message: "Failed to update Department" });
  }
};
