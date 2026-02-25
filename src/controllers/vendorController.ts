import { Request, Response } from "express";
import db from "../config/db";

export const addVendor = async (req: Request, res: Response) => {
  const { VendorName } = req.body;
  if (!VendorName) {
    return res.status(400).json({
      message: "Vendor Name is required",
    });
  }
  try {
    const result = await db.query(
      `
        INSERT INTO vendor (VendorName)
        VALUES ($1)
        RETURNING VendorId AS "VendorId";
      `,
      [VendorName]
    );

    const newVendorId = result.rows[0]?.VendorId;

    res.status(201).json({
      message: "Request Created Successfully",
      VendorId: newVendorId,
    });
  } catch (error: any) {
    console.error("Error creating vendor:", error);
    res.status(500).json({
      message: "Failed to create vendor",
    });
  }
};

export const getVendors = async (req: Request, res: Response) => {
  try {
    const result = await db.query(`
      SELECT
        VendorId AS "VendorId",
        VendorName AS "VendorName"
      FROM vendor
      ORDER BY VendorId ASC;
    `);

    const vendors = result.rows.map((row: any) => ({
      VendorId: row.VendorId,
      VendorName: row.VendorName,
    }));

    res.status(200).json(vendors);
  } catch (error: any) {
    console.error("Error fetching vendors from db:", error);
    res.status(500).json({
      message: "Failed to fetch vendors from db",
    });
  }
};

export const deleteVendor = async (req: Request, res: Response) => {
  const { id } = req.params;
  const VendorId = Number(id);

  if (isNaN(VendorId) || VendorId <= 0) {
    return res.status(400).json({ message: "Invalid Vendor ID" });
  }

  try {
    const deleteQuery = `
        DELETE FROM vendor
        WHERE VendorId = $1`;
    const deleteResult = await db.query(deleteQuery, [VendorId]);

    if (deleteResult.rowCount === 0) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    res.status(200).json({
      message: "Vendor deleted successfully",
      VendorId,
    });
  } catch (error: any) {
    console.error("Error deleting vendor:", error);
    res.status(500).json({ message: "Failed to delete vendor" });
  }
};

export const updateVendor = async (req: Request, res: Response) => {  
  const { id } = req.params;
  const vendorId = Number(id);

  if (isNaN(vendorId) || vendorId < 0) {
    return res.status(400).json({ message: "The vendor id is invalid" });
  }

  const { vendorName } = req.body;

  if (vendorName === undefined) {
    return res
      .status(400)
      .json({ message: "Vendor name field is not provided" });
  }

  try {
    let updateQuery = "UPDATE vendor SET ";
    const updates: string[] = [];
    const values: any[] = [];
    let index = 1;

    if (vendorName !== undefined) {
      updates.push(`VendorName=$${index++}`);
      values.push(vendorName);
    }

    updateQuery += updates.join(", ");
    updateQuery += ` WHERE VendorId = $${index}`;
    values.push(vendorId);

    const result = await db.query(updateQuery, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    res.status(200).json({
      message: "Vendor updated successfully",
      vendorId,
    });
  } catch (error: any) {
    console.error("Failed Updating vendor", error);
    res.status(500).json({ message: "Failed to update vendor" });
  }
};
