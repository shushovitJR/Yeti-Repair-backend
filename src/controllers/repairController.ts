import {Request, Response} from 'express';
import db from '../config/db';

const formatDate = (value: any) => {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().split('T')[0];
  if (typeof value === 'string') return value.split('T')[0];
  return null;
};

export const createRepairRequest = async (req: Request, res: Response) => {
  const {
    IssueDescription,
    IssueDate,
    ReturnDate,
    VendorName,
    Cost,
    DeviceName,
    DepartmentName,
    Category,
    Status = 'Pending',
  } = req.body;
  
  if (!IssueDescription || !VendorName || !DeviceName || !Category || !DepartmentName){
    return res.status(400).json({ message:"Missing required fields" });
  }

  try{
    const vendorCheck = await db.query(`
        SELECT VendorId FROM vendor
        WHERE VendorName = $1; 
      `, [VendorName]);
      if (vendorCheck.rows.length === 0){
        return res.status(400).json({ message:"Vendor Doesn't Exist" })
      }

      const VendorId = vendorCheck.rows[0].vendorid;

    const departmentCheck = await db.query(`
        SELECT DepartmentId FROM department
        WHERE DepartmentName = $1;
      `, [DepartmentName])
      if (departmentCheck.rows.length === 0){
        return res.status(400).json({ message:"Department Doen't Exist" })
      }

      const DepartmentId = departmentCheck.rows[0].departmentid;

    const categoryCheck = await db.query(`
        SELECT DeviceCatId from devicecat
        WHERE DeviceCatName = $1;
      `, [Category]);
    if (categoryCheck.rows.length === 0){
      return res.status(400).json({ message:"Device Category Doesn't exist" })
    }
    const CategoryId = categoryCheck.rows[0].devicecatid;

    const statusCheck = await db.query(`
        SELECT RepairStatusId FROM repairstatus
        WHERE RepairStatusName = $1;
      `, [Status])
    const StatusId = statusCheck.rows[0].repairstatusid;

    let DeviceId: number;
    const createDevice = await db.query(
        `
            INSERT INTO device (DeviceName, Category)
            VALUES ($1, $2)
            RETURNING DeviceId AS "DeviceId";
          `,
        [DeviceName, CategoryId]
      )
        DeviceId = createDevice.rows[0].DeviceId;

    const result = await db.query(
          `
              INSERT INTO repair (IssueDescription, IssueDate, ReturnDate, Cost, VendorId, DeviceId, StatusId, DepartmentId)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
              RETURNING RepairId AS "RepairId";
            `,
          [IssueDescription, IssueDate, ReturnDate, Cost, VendorId, DeviceId, StatusId, DepartmentId]
        )
        const RepairId = result.rows[0].RepairId;
        
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
          const result = await db.query(`
                  SELECT
                  r.RepairId AS "RepairId",
                  r.IssueDescription AS "IssueDescription",
                  r.IssueDate AS "IssueDate",
                  r.ReturnDate AS "ReturnDate",
                  r.Cost AS "Cost",
                  s.RepairStatusName AS StatusName,
                  s.Color AS "Color",
                  d.DeviceName AS "DeviceName",
                  dc.DeviceCatName AS Category,
                  v.VendorName AS "VendorName",
                  dep.DepartmentName AS "DepartmentName"
              FROM repair r
                  LEFT JOIN repairstatus s ON r.StatusId = s.RepairStatusId
                  LEFT JOIN device d ON r.DeviceId = d.DeviceId
                  LEFT JOIN devicecat dc ON d.Category = dc.DeviceCatId
                  LEFT JOIN vendor v ON r.VendorId = v.VendorId
                  LEFT JOIN department dep ON r.DepartmentId = dep.DepartmentId
              ORDER BY 
                  r.RepairId DESC;   
              `);

              const repairs = result.rows.map((row: any)=>({
                RepairId: `REP${String(row.RepairId).padStart(3, '0')}`,
                Issue: row.IssueDescription,
                IssueDate: formatDate(row.IssueDate),
                ReturnDate: formatDate(row.ReturnDate),
                Cost: row.Cost,
                Status: row.StatusName,
                Color: row.Color,
                DeviceName: row.DeviceName,
                Category: row.Category,
                Vendor: row.VendorName,
                DepartmentName: row.DepartmentName,
              }))


          res.status(200).json(repairs);
      } catch (error: any){
          console.error('Failed to retreive repair requests', error);
          res.status(500).json({ message:"Failed to get repair requests" });
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
    DepartmentName
  } = req.body;

    if (!IssueDescription && ! IssueDate && !ReturnDate && !VendorName && !Status && !Cost && !DepartmentName){
      return res.status(400).json({ message:"No fields provided to edit" });
    }

    if (IssueDescription !== undefined && (typeof IssueDescription !== 'string' || IssueDescription.trim() === '' )){
        return res.status(400).json({ message:"Issue Description is of invalid type" });
    }
    if (IssueDate !== undefined && IssueDate !== null && (typeof IssueDate !== 'string' || IssueDate.trim() === '' )){
        return res.status(400).json({ message:"Issue Date is of invalid type" });
    }
    if (ReturnDate !== undefined && ReturnDate !== null && (typeof ReturnDate !== 'string' || ReturnDate.trim() === '' )){
        return res.status(400).json({ message:"Return Date is of invalid type" });
    }
    if (VendorName !== undefined && (typeof VendorName !== 'string' || VendorName.trim() === '' )){
        return res.status(400).json({ message:"Vendor Name is of invalid type" });
    }
    if (Status !== undefined && (typeof Status !== 'string' || Status.trim() === '' )){
        return res.status(400).json({ message:"Status is of invalid type" });
    }
    if (DepartmentName !== undefined && (typeof DepartmentName !== 'string' || DepartmentName.trim() === '' )){
        return res.status(400).json({ message:"Department name is of invalid type" });
    }
   

    try{
      const updates: string[] = [];

        const checkStatus = await db.query(`
            SELECT RepairStatusId FROM repairstatus
            WHERE RepairStatusName = $1;
          `, [Status])
          if (checkStatus.rows.length === 0){
            return res.status(400).json({ message:"Status name not specified or doesn't exist" });
          }
          
          const StatusId = checkStatus.rows[0].repairstatusid;


        const checkVendor = await db.query(`
            SELECT VendorId FROM vendor
            WHERE VendorName = $1;
          `, [VendorName])
          if (checkVendor.rows.length === 0){
            return res.status(400).json({ message:"Vendor name not specified or doesn't exist" });
          }
          
          const VendorId = checkVendor.rows[0].vendorid;

          const checkDepartment = await db.query(`
            SELECT DepartmentId FROM department
            WHERE DepartmentName = $1;
          `, [DepartmentName])
          if (checkDepartment.rows.length === 0){
            return res.status(400).json({ message:"Department name not specified or doesn't exist" });
          }
          
          const DepartmentId = checkDepartment.rows[0].departmentid;
          const values: any[] = [];
          let index = 1;
         
    if (IssueDescription !== undefined){
      updates.push(`IssueDescription = $${index++}`)
      values.push(IssueDescription)
    }
    if (IssueDate !== undefined){
      updates.push(`IssueDate = $${index++}`)
      values.push(IssueDate)
    }
    if (ReturnDate !== undefined){
      updates.push(`ReturnDate = $${index++}`)
      values.push(ReturnDate)
    }
    if (VendorId !== undefined){
      updates.push(`VendorId = $${index++}`)
      values.push(VendorId)
    }
    if (StatusId !== undefined){
      updates.push(`StatusId = $${index++}`)
      values.push(StatusId)
    }
    if (Cost !== undefined){
      updates.push(`Cost = $${index++}`)
      values.push(Cost)
    }
    if (DepartmentId !== undefined){
      updates.push(`DepartmentId = $${index++}`)
      values.push(DepartmentId)
    }

    values.push(RepairId);
    const result = await db.query(`
          UPDATE repair
          SET ${updates.join(', ')}
          WHERE RepairId = $${index};
      `, values);

      if (result.rowCount === 0){
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
  const { id } = req.params;
  const RepairId = Number(id);
  
  if (isNaN(RepairId) || RepairId <= 0){
    return res.status(400).json({ message:"Invalid repair id" });
  }

  try{
    const result = await db.query(`
          DELETE FROM repair
          WHERE RepairId = $1;
        `, [RepairId]);

    if (result.rowCount===0){
      return res.status(400).json({ message:"Could not find repair id" });
    }

    res.status(200).json({ 
      message:"Successfully deleted the repair request",
      RepairId,
     });
  } catch (error: any) {
      console.error('Failed to delete the repair', error);
      res.status(500).json({ message:"Failed to remove repair request" });
  }

}
