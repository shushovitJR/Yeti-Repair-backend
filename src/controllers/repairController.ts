import {Request, Response} from 'express';
import sql from '../config/db';

export const createRepairRequest = async (req: Request, res: Response) => {
  const {
    IssueDescription,
    IssueDate,
    ReturnDate,
    VendorName,
    Cost,
    DeviceName,
    Category,
    Status = 'Pending',
  } = req.body;

  if (!IssueDescription || !VendorName || !DeviceName || !Category){
    return res.status(400).json({ message:"Missing required fields" });
  }

  try{
    const request = new sql.Request();
    const vendorCheck = await request.input('VendorName', VendorName).query(`
        SELECT VendorId FROM vendor
        WHERE VendorName = @VendorName; 
      `);
      if (vendorCheck.recordset.length === 0){
        return res.status(400).json({ message:"Vendor Doesn't Exist" })
      }

      const VendorId = vendorCheck.recordset[0].VendorId;

    const categoryCheck = await request.input('DeviceCatName', Category).query(`
        SELECT DeviceCatId from devicecat
        WHERE DeviceCatName = @DeviceCatName;
      `);
    if (categoryCheck.recordset.length === 0){
      return res.status(400).json({ message:"Device Category Doesn't exist" })
    }
    const CategoryId = categoryCheck.recordset[0].DeviceCatId;

    const statusCheck = await request.input('RepairStatusName', Status).query(`
        SELECT RepairStatusId FROM repairstatus
        WHERE RepairStatusName = @RepairStatusName;
      `)
    const StatusId = statusCheck.recordset[0].RepairStatusId;

    let DeviceId: number;
    const createDevice = await request
        .input('Category', CategoryId)
        .input('DeviceName', DeviceName)
        .query(`
            INSERT INTO device (DeviceName, Category)
            VALUES (@DeviceName, @Category)

            SELECT SCOPE_IDENTITY() AS DeviceId;
          `)
        DeviceId = createDevice.recordset[0].DeviceId;

    const result = await request
          .input('IssueDescription', IssueDescription)
          .input('IssueDate', IssueDate)
          .input('ReturnDate', ReturnDate)
          .input('Cost', Cost)
          .input('StatusId', StatusId)
          .input('VendorId', VendorId)
          .input('DeviceId', DeviceId)
          .query(`
              INSERT INTO repair (IssueDescription, IssueDate, ReturnDate, Cost, VendorId, DeviceId, StatusId)
              VALUES (@IssueDescription, @IssueDate, @ReturnDate, @Cost, @VendorId, @DeviceId, @StatusId)

              SELECT SCOPE_IDENTITY() AS RepairId;
            `)
        const RepairId = result.recordset[0].RepairId;
        
        res.status(201).json({
          message:"Successfully Created repair request",
          RepairId,
          DeviceId,
          })
  } catch (error: any){
      console.error('Failed to create repair request', error);
      res.status(500).json({ message:"Failed to create repair record" });
  }
};

export const getRepairRequest = async (req: Request, res: Response)=>{
  try{
          const request = new sql.Request();
          const result = await request.query(`
                  SELECT
                  r.RepairId,
                  r.IssueDescription,
                  r.IssueDate,
                  r.ReturnDate,
                  r.Cost,
                  s.RepairStatusName AS StatusName,
                  s.Color,
                  d.DeviceName,
                  dc.DeviceCatName AS Category,
                  v.VendorName
              FROM repair r
                  LEFT JOIN repairstatus s ON r.StatusId = s.RepairStatusId
                  LEFT JOIN device d ON r.DeviceId = d.DeviceId
                  LEFT JOIN devicecat dc ON d.Category = dc.DeviceCatId
                  LEFT JOIN vendor v ON r.VendorId = v.VendorId
              ORDER BY 
                  r.RepairId DESC;   
              `);

              const repairs = result.recordset.map((row: any)=>({
                RepairId: `REQ${String(row.RepairId).padStart(3, '0')}`,
                Issue: row.IssueDescription,
                IssueDate: row.IssueDate ? row.IssueDate.toISOString().split('T')[0] : null,
                ReturnDate: row.ReturnDate ? row.ReturnDate.toISOString().split('T')[0] : null,
                Cost: row.Cost,
                Status: row.StatusName,
                Color: row.Color,
                DeviceName: row.DeviceName,
                Category: row.Category,
                Vendor: row.VendorName,
              }))


          res.status(200).json(repairs);
      } catch (error: any){
          console.error('Failed to retreive repair requests', error);
          res.status(500).json({ message:"Failed to get repair requests" });
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
          r.IssueDescription AS Issue,
          r.IssueDate,
          r.ReturnDate,
          s.RepairStatusName AS Status,
          r.Cost,
          dc.DeviceCatName AS Category,
          d.DeviceName,
          v.VendorName AS Vendor
        FROM repair r
        INNER JOIN device d ON r.DeviceId = d.DeviceId
        INNER JOIN devicecat dc ON d.DeviceId = dc.DeviceCatId
        INNER JOIN vendor v ON r.VendorId = v.VendorId
        INNER JOIN repairstatus s ON r.StatusId = s.RepairStatusId
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
      cost: repair.Cost,
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

export const updateRepairRequest = async (req: Request, res: Response) => {
  const { id } = req.params;
  const RepairId = Number(id);

  if (isNaN(RepairId) || RepairId <= 0){
    return res.status(400).json({ message:"Invalid repair id" });
  }

  const {
    IssueDescription,
    IssueDate,
    ReturnDate,
    VendorName,
    Status,
    Cost,
  } = req.body;

    if (!IssueDescription && ! IssueDate && !ReturnDate && !VendorName && !Status && !Cost){
      return res.status(400).json({ message:"No fields provided to edit" });
    }

    if (IssueDescription !== undefined && (typeof IssueDescription !== 'string' || IssueDescription.trim() === '' )){
        return res.status(400).json({ message:"Issue Description is of invalid type" });
    }
    if (IssueDate !== undefined && (typeof IssueDate !== 'string' || IssueDate.trim() === '' )){
        return res.status(400).json({ message:"Issue Date is of invalid type" });
    }
    if (ReturnDate !== undefined && (typeof ReturnDate !== 'string' || ReturnDate.trim() === '' )){
        return res.status(400).json({ message:"Return Date is of invalid type" });
    }
    if (VendorName !== undefined && (typeof VendorName !== 'string' || VendorName.trim() === '' )){
        return res.status(400).json({ message:"Vendor Name is of invalid type" });
    }
    if (Status !== undefined && (typeof Status !== 'string' || Status.trim() === '' )){
        return res.status(400).json({ message:"Status is of invalid type" });
    }
   

    try{
      const request = new sql.Request()
      const updates: string[] = [];

        const checkStatus = await request.input('RepairStatusName', Status).query(`
            SELECT RepairStatusId FROM repairstatus
            WHERE RepairStatusName = @RepairStatusName;
          `)
          if (checkStatus.recordset.length === 0){
            return res.status(400).json({ message:"Status name not specified or doesn't exist" });
          }
          
          const StatusId = checkStatus.recordset[0].RepairStatusId;


        const checkVendor = await request.input('VendorName', VendorName).query(`
            SELECT VendorId FROM vendor
            WHERE VendorName = @VendorName;
          `)
          if (checkVendor.recordset.length === 0){
            return res.status(400).json({ message:"Vendor name not specified or doesn't exist" });
          }
          
          const VendorId = checkVendor.recordset[0].VendorId;
         
    if (IssueDescription !== undefined){
      updates.push('IssueDescription = @IssueDescription')
      request.input('IssueDescription', IssueDescription)
    }
    if (IssueDate !== undefined){
      updates.push('IssueDate = @IssueDate')
      request.input('IssueDate', IssueDate)
    }
    if (ReturnDate !== undefined){
      updates.push('ReturnDate = @ReturnDate')
      request.input('ReturnDate', ReturnDate)
    }
    if (VendorId !== undefined){
      updates.push('VendorId = @VendorId')
      request.input('VendorId', VendorId)
    }
    if (StatusId !== undefined){
      updates.push('StatusId = @StatusId')
      request.input('StatusId', StatusId)
    }
    if (Cost !== undefined){
      updates.push('Cost = @Cost')
      request.input('Cost', Cost)
    }

    const result = await request.input("RepairId", RepairId).query(`
          UPDATE repair
          SET ${updates.join(', ')}
          WHERE RepairId = @RepairId;
      `);

      if (result.rowsAffected[0] === 0){
        return res.status(404).json({ message:"Repair not found" })
      }

      res.status(200).json({ 
        message: "Successfully updated repair request",
        RepairId,
       })

    } catch(error: any){
      console.error("Failed to update repair request", error);
      res.status(500).json({ message:"Failed to update repair record" });
    }

};

export const deleteRepairRequest = async (req: Request, res: Response) => {
  
}