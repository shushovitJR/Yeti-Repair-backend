import {Request, Response} from 'express';
import sql from '../config/db';

export const createRepairRequest = async (req: Request, res: Response) => {
  const {
    DeviceCategory,
    DeviceName,
    IssueDescription,
    IssueDate,
    ReturnDate,
    VendorName,
    RepairStatus = 'Pending',
  } = req.body;

  if (!DeviceCategory || !DeviceName || !IssueDescription || !VendorName || !IssueDate) {
    return res.status(400).json({
      message: 'Missing required fields: DeviceCategory, DeviceName, IssueDescription, and VendorId',
    });
  }

  try {
    let DeviceId: number;
    let VendorId: number;

    // Query 1: Check if device exists → NEW REQUEST
    const checkRequest = new sql.Request();
    const deviceCheck = await checkRequest
      .input('DeviceName', DeviceName)
      .input('DeviceCategory', DeviceCategory)
      .query(`
        SELECT DeviceId 
        FROM device 
        WHERE DeviceName = @DeviceName 
          AND DeviceCategory = @DeviceCategory
      `);

    if (deviceCheck.recordset.length > 0) {
      DeviceId = deviceCheck.recordset[0].DeviceId;
    } else {
      // Query 2: Insert new device → NEW REQUEST
      const insertDeviceRequest = new sql.Request();
      const insertDevice = await insertDeviceRequest
        .input('DeviceCategory', DeviceCategory)
        .input('DeviceName', DeviceName)
        .query(`
          INSERT INTO device (DeviceCategory, DeviceName)
          OUTPUT INSERTED.DeviceId
          VALUES (@DeviceCategory, @DeviceName);
        `);

      DeviceId = insertDevice.recordset[0].DeviceId;
    }

    const checkVendor = new sql.Request();
    const vendorResult = await checkVendor
      .input('VendorName', VendorName)
      .query(`
        SELECT VendorId
        FROM vendor
        WHERE VendorName = @VendorName
        `);

        

        if (vendorResult.recordset.length === 0){
          return res.status(400).json({
            message: 'Vendor not found. Please register the vendor before creating a repair request',
          })
        }
        VendorId = vendorResult.recordset[0].VendorId;
        
    // Query 3: Insert repair → NEW REQUEST
    const repairRequest = new sql.Request();
    const repairResult = await repairRequest
      .input('DeviceId', DeviceId)
      .input('IssueDescription', IssueDescription)
      .input('IssueDate', IssueDate || null)
      .input('ReturnDate', ReturnDate || null)
      .input('RepairStatus', RepairStatus)
      .input('VendorId', VendorId)
      .query(`
        INSERT INTO repair 
        (DeviceId, IssueDescription, IssueDate, ReturnDate, RepairStatus, VendorId)
        VALUES 
        (@DeviceId, @IssueDescription, @IssueDate, @ReturnDate, @RepairStatus, @VendorId)
        
        SELECT SCOPE_IDENTITY() AS RepairId;
      `);

    const newRepairId = repairResult.recordset[0]?.RepairId;

    res.status(201).json({
      message: 'Repair request created successfully',
      repairId: newRepairId,
      deviceId: DeviceId,
    });
  } catch (error: any) {
    console.error('Error creating repair request:', error);
    res.status(500).json({ 
      message: 'Failed to create repair request',
      // Optional: include error.message only in development
      // error: error.message 
    });
  }
};

export const getRepairRequest = async (req: Request, res: Response)=>{
  try{
    const request = new sql.Request();

    const result = await request.query(
      `SELECT
        r.RepairId,
        r.IssueDescription AS Issue,
        r.IssueDate,
        r.ReturnDate,
        r.RepairStatus AS Status,
        d.DeviceName,
        d.DeviceCategory AS Category,
        v.VendorName AS Vendor
      FROM repair r
      INNER JOIN device d ON r.DeviceId = d.DeviceId
      INNER JOIN vendor v ON r.VendorId = v.VendorId
      ORDER BY r.IssueDate DESC;
      `);

      const repairs = result.recordset.map((row: any) => ({
      RepairId: `REP${String(row.RepairId).padStart(3, '0')}`, // e.g., REP001
      DeviceName: row.DeviceName,
      Category: row.Category,
      Issue: row.Issue,
      IssueDate: row.IssueDate ? row.IssueDate.toISOString().split('T')[0] : '-',
      ReturnDate: row.ReturnDate ? row.ReturnDate.toISOString().split('T')[0] : '-',
      Status: row.Status,
      Vendor: row.Vendor,
    }));
    
    res.status(200).json(repairs);
  } catch (error: any){
    console.error('Error fetching repair requests:', error);
    res.status(500).json({
      message: 'Failed to fetch repair requests',
    });
  }
};

export const getRepairRequestById = async (req: Request, res: Response)=>{
  const { id } = req.params;

  const RepairId = Number(id);
  if (isNaN(RepairId) || RepairId<=0){
    return res.status(400).json({message: 'Invalid repair ID'});
  }

  try {
    const request = new sql.Request();

    const result = await request
      .input('RepairId', RepairId)
      .query(`
        SELECT
          r.RepairId,
          r.DeviceId,
          r.IssueDescription AS Issue,
          r.IssueDate,
          r.ReturnDate,
          r.RepairStatus AS Status,
          d.DeviceCategory AS Category,
          d.DeviceName,
          v.VendorName AS Vendor
        FROM repair r
        INNER JOIN device d ON r.DeviceId = d.DeviceId
        INNER JOIN vendor v ON r.VendorId = v.VendorId
        WHERE r.RepairId = @RepairId;
        `);
        if (result.recordset.length === 0){
          return res.status(404).json({message: "Repair request not found"});
        }

        const repair = result.recordset[0];

        const formattedRepair = {
      repairId: `REP${String(repair.RepairId).padStart(3, '0')}`,
      category: repair.Category,
      name: repair.DeviceName,
      issue: repair.Issue,
      issueDate: repair.IssueDate ? repair.IssueDate.toISOString().split('T')[0] : null,
      returnedDate: repair.ReturnDate ? repair.ReturnDate.toISOString().split('T')[0] : null,
      status: repair.Status,
      vendor: repair.Vendor,
    };

    res.status(200).json(formattedRepair);
  } catch (error: any){
    console.log('Error fetching repair request:', error);
    res.status(500).json({message: 'Failed to fetch repair request'});
  }
};

type UpdateFields = {
  IssueDescription?: string;
  IssueDate?: string;
  ReturnDate?: string | null;
  RepairStatus?: string;
  VendorName?: string;  // <-- NEW: Accept VendorName instead of VendorId
};

const VALID_STATUSES = ['Pending', 'In Progress', 'Completed'];

export const updateRepairRequest = async (req: Request, res: Response) => {
  const { id } = req.params;
  const RepairId = Number(id);

  if (isNaN(RepairId) || RepairId <= 0) {
    return res.status(400).json({ message: 'Invalid repair ID' });
  }

  const {
    IssueDescription,
    IssueDate,
    ReturnDate,
    RepairStatus,
    VendorName,  // <-- Now we expect VendorName
  } = req.body as UpdateFields;

  // Check if at least one field is provided
  if (
    !IssueDescription &&
    !IssueDate &&
    !ReturnDate &&
    !RepairStatus &&
    !VendorName
  ) {
    return res.status(400).json({ message: 'No fields provided to update' });
  }

  if (RepairStatus && !VALID_STATUSES.includes(RepairStatus)) {
    return res.status(400).json({
      message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
    });
  }

  try {
    const request = new sql.Request();

    // Step 1: If VendorName is provided, look up VendorId
    let VendorId: number | null = null;
    if (VendorName !== undefined) {
      const vendorResult = await request
        .input('VendorName', sql.NVarChar, VendorName)
        .query(`
          SELECT VendorId 
          FROM Vendor 
          WHERE VendorName = @VendorName
        `);

      if (vendorResult.recordset.length === 0) {
        return res.status(400).json({
          message: `Vendor "${VendorName}" not found`,
        });
      }

      VendorId = vendorResult.recordset[0].VendorId;
    }

    // Step 2: Build the UPDATE query
    let updateQuery = 'UPDATE repair SET ';
    const updates: string[] = [];
    const params: any = {};

    if (IssueDescription !== undefined) {
      updates.push('IssueDescription = @IssueDescription');
      params.IssueDescription = IssueDescription;
    }
    if (IssueDate !== undefined) {
      updates.push('IssueDate = @IssueDate');
      params.IssueDate = IssueDate;
    }
    if (ReturnDate !== undefined) {
      updates.push('ReturnDate = @ReturnDate');
      params.ReturnDate = ReturnDate === null || ReturnDate === '' ? null : ReturnDate;
    }
    if (RepairStatus !== undefined) {
      updates.push('RepairStatus = @RepairStatus');
      params.RepairStatus = RepairStatus;
    }
    if (VendorName !== undefined) {
      // We already have VendorId from lookup
      updates.push('VendorId = @VendorId');
      params.VendorId = VendorId;
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    updateQuery += updates.join(', ');
    updateQuery += ' WHERE RepairId = @RepairId';

    // Step 3: Add RepairId to parameters
    request.input('RepairId', sql.Int, RepairId);

    // Step 4: Add all other parameters
    Object.entries(params).forEach(([key, value]) => {
      request.input(key, value);
    });

    // Step 5: Execute the update
    const result = await request.query(updateQuery);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Repair request not found' });
    }

    res.status(200).json({
      message: 'Repair request updated successfully',
      RepairId: RepairId,
    });
  } catch (error: any) {
    console.error('Error updating repair request:', error);
    res.status(500).json({ message: 'Failed to update repair request' });
  }
};