import { Request, Response } from "express";
import db from "../config/db";

export const createDevice = async (req: Request, res: Response) => {
  const { DeviceCatName, DeviceDescription } = req.body;

  if (!DeviceCatName) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const hasDescription = DeviceDescription && DeviceDescription.trim() !== "";

  try {
    let result;

    if (hasDescription) {
      result = await db.query(
        `
        INSERT INTO devicecat (DeviceCatName, DeviceDescription)
        VALUES ($1, $2)
        RETURNING DeviceCatId AS "DeviceCatId";
      `,
        [DeviceCatName, DeviceDescription]
      );
    } else {
      result = await db.query(
        `
        INSERT INTO devicecat (DeviceCatName)
        VALUES ($1)
        RETURNING DeviceCatId AS "DeviceCatId";
      `,
        [DeviceCatName]
      );
    }

    const newDeviceId = result.rows[0]?.DeviceCatId;

    res.status(200).json({
      message: "Category Created Successfully",
      DeviceCategoryId: newDeviceId,
    });
  } catch (error) {
    console.error("Error creating device category", error);
    res.status(500).json({ message: "Failed to create device category" });
  }
};

export const getDevices = async (req: Request, res: Response) => {
  try {
    const result = await db.query(`
      SELECT
        DeviceCatId AS "DeviceCatId",
        DeviceCatName AS "DeviceCatName",
        DeviceDescription AS "DeviceDescription"
      FROM devicecat;
    `);

    const devices = result.rows.map((row: any) => ({
      DeviceCategoryId: row.DeviceCatId,
      DeviceCategoryName: row.DeviceCatName,
      DeviceDescription: row.DeviceDescription,
    }));
    res.status(200).json(devices);
  } catch (error: any) {
    console.error("Failed to get Devices", error);
    res.status(500).json({ message: "Could not get Device Categories" });
  }
};

export const updateDevice = async (req: Request, res: Response) => {
  const { id } = req.params;
  const DeviceCatId = Number(id);

  if (isNaN(DeviceCatId) || DeviceCatId <= 0) {
    return res.status(400).json({ message: "Invalid Device Category Id" });
  }

  const { DeviceCatName, DeviceDescription } = req.body;

  if (DeviceCatName === undefined && DeviceDescription === undefined) {
    return res.status(400).json({ message: "Missing required field" });
  }

  try {
    let updates: string[] = [];
    const values: any[] = [];
    let index = 1;

    if (DeviceCatName !== undefined) {
      updates.push(`DeviceCatName = $${index++}`);
      values.push(DeviceCatName);
    }
    if (DeviceDescription !== undefined) {
      updates.push(`DeviceDescription = $${index++}`);
      values.push(DeviceDescription);
    }
    values.push(DeviceCatId);

    const query = `
            UPDATE devicecat
            SET ${updates.join(", ")}
            WHERE DeviceCatId = $${index}
        `;

    const result = await db.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Device Category not found" });
    }

    res.status(200).json({
      message: "Successfully edited Category",
      DeviceCategoryId: DeviceCatId,
    });
  } catch (error: any) {
    console.error("Failed to edit Category", error);
    res.status(500).json({ message: "Error editing Category" });
  }
};

export const deleteDevice = async (req: Request, res: Response) => {
  const { id } = req.params;
  const DeviceCatId = Number(id);

  if (isNaN(DeviceCatId) || DeviceCatId <= 0) {
    return res.status(400).json({ message: "Invalid Category Id" });
  }

  try {
    const deleteDevices = await db.query(
      `
        DELETE FROM device
        WHERE Category = $1;
      `,
      [DeviceCatId]
    );
    if (deleteDevices.rowCount === 0){
      return res.status(404).json({ message:"Failed to delete devices of this category" })
    }
    const result = await db.query(
      `
                DELETE FROM devicecat
                WHERE DeviceCatId = $1;  
            `,
      [DeviceCatId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Device category not found" });
    }

    res.status(200).json({
      message: "Succesfully deleted the device",
      DeviceCatId,
    });
  } catch (error: any) {
    console.error("Failed deleting device", error);
    res.status(500).json({ message: "Failed to delete the device" });
  }
};
