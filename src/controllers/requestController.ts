import {Request, Response} from 'express';
import db from '../config/db.js';
import { AuthRequest } from '../middlewares/authMiddleware';

const formatDate = (value: any) => {
    if (!value) return null;
    if (value instanceof Date) return value.toISOString().split('T')[0];
    if (typeof value === 'string') return value.split('T')[0];
    return null;
};

export const createRequest = async (req: AuthRequest, res: Response)=>{
    const { 
        RequesterName,
        DepartmentName,
        DeviceName,
        Category,
        Reason,
        RequestDate,
        Cost,
        Status = 'Pending'
     } = req.body
     const UserName = req.user?.UserId;

     if (!DeviceName || !Category || !Reason || !RequesterName || !DepartmentName || !RequestDate){
        return res.status(400).json({ message:"Fill the following fields: Device name and category, Reason, Name of person and department and request date" });
     }
     if (!UserName){
        return res.status(400).json({ message:"Cannot find user" })
     }
     try{
        const checkStatus = await db.query(
            `
                    SELECT RequestStatusId FROM requeststatus
                    WHERE RequestStatusName = $1;
                `,
            [Status]
        );
            if (checkStatus.rows.length === 0){
                return res.status(400).json({ message:"Status Not Found" })
            }
            const StatusId = checkStatus.rows[0].requeststatusid;

        const checkDepartment = await db.query(`
                SELECT DepartmentId FROM department
                WHERE DepartmentName = $1;
            `, [DepartmentName])
            if (checkDepartment.rows.length === 0){
                return res.status(400).json({ message:"Department Not Found" })
            }
            const DepartmentId = checkDepartment.rows[0].departmentid;

        const checkDeviceCat = await db.query(
            `
                    SELECT DeviceCatId from devicecat
                    WHERE DeviceCatName = $1
                `,
            [Category]
        );

            if (checkDeviceCat.rows.length === 0){
                return res.status(400).json({ message:"Device Category not found" });
            }
            const CategoryId = checkDeviceCat.rows[0].devicecatid;

        const createDevice = await db.query(
            `
                    INSERT INTO device(DeviceName, Category)
                    VALUES ($1, $2)
                    RETURNING DeviceId AS "DeviceId";
                `,
            [DeviceName, CategoryId]
        );
            const DeviceId = createDevice.rows[0].DeviceId;

        const result = await db.query(
            `
                    INSERT INTO request (RequesterName, Reason, DeviceId, StatusId, UserId, DepartmentId, RequestDate, Cost)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    RETURNING RequestId AS "RequestId";
                `,
            [RequesterName, Reason, DeviceId, StatusId, UserName, DepartmentId, RequestDate, Cost]
        )
            const RequestId = result.rows[0].RequestId;

            res.status(201).json({ 
                message:"Successfully created a request",
                RequestId,
             })
     } catch (error: any){
        console.error('Failed to create request', error)
        res.status(500).json({ message:"Failed to create device request" })
     }
};

export const getRequest = async (req: Request, res: Response)=>{
    try{
        const result = await db.query(`
                SELECT 
                r.RequestId AS "RequestId",
                r.Reason AS "Reason",
                r.RequestDate AS "RequestDate",
                r.RecieveDate AS "RecieveDate",
                r.Cost AS "Cost",
                s.RequestStatusName AS "RequestStatusName",
                s.Color AS "Color",
                d.DeviceName AS "DeviceName",
                dc.DeviceCatName AS "DeviceCatName",
                r.RequesterName AS "EmployeeName",
                de.DepartmentName AS "DepartmentName"
                FROM request r
                LEFT JOIN requeststatus s ON r.StatusId = s.RequestStatusId
                LEFT JOIN device d ON r.DeviceId = d.DeviceId
                LEFT JOIN devicecat dc ON d.Category = dc.DeviceCatId
                LEFT JOIN department de ON r.DepartmentId = de.DepartmentId
                ORDER BY 
                    r.RequestId DESC;
            `);
        const requests = result.rows.map((row: any)=>({
            RequestId: `REQ${String(row.RequestId).padStart(3, '0')}`,
            Reason: row.Reason,
            RequestDate: formatDate(row.RequestDate),
            RecieveDate: formatDate(row.RecieveDate),
            Status: row.RequestStatusName,
            Cost: row.Cost,
            Color: row.Color,
            DeviceName: row.DeviceName,
            Category: row.DeviceCatName,
            Name: row.EmployeeName,
            Department: row.DepartmentName,
        }))

        res.status(200).json({ requests });
    } catch (error: any){
        console.error("Failed to fetch Device Requests");
        res.status(500).json({ message:"Failed to get Request Data" });
    }
};

export const updateRequest = async (req: Request, res: Response) => {
  const { id } = req.params;
  const RequestId = Number(id);

  if (isNaN(RequestId) || RequestId <= 0){
    return res.status(400).json({ message:"Invalid request id" })
  }

  const {
    RequesterName,
    DepartmentName,
    Reason,
    Cost,
    RequestDate,
    RecieveDate,
    Status,
  } = req.body;

    if (!Reason && ! RequestDate && !RecieveDate && !Status && !RequesterName && !DepartmentName && !Cost){
      return res.status(400).json({ message:"No fields provided to edit" });
    }
    if (Reason !== undefined && (typeof Reason !== 'string' || Reason.trim() === '' )){
        return res.status(400).json({ message:"Reason is of invalid type" });
    }
    if (RequestDate !== undefined && (typeof RequestDate !== 'string' || RequestDate.trim() === '' )){
        return res.status(400).json({ message:"Request Date is of invalid type" });
    }
    if (RecieveDate !== undefined && (typeof RecieveDate !== 'string' || RecieveDate.trim() === '' )){
        return res.status(400).json({ message:"Recieve Date is of invalid type" });
    }
    if (Status !== undefined && (typeof Status !== 'string' || Status.trim() === '' )){
        return res.status(400).json({ message:"Status is of invalid type" });
    }
    if (RequesterName !== undefined && (typeof RequesterName !== 'string' || RequesterName.trim() === '' )){
        return res.status(400).json({ message:"Name is of invalid type" });
    }
    if (DepartmentName !== undefined && (typeof DepartmentName !== 'string' || DepartmentName.trim() === '' )){
        return res.status(400).json({ message:"Department is of invalid type" });
    }

    try{
        const updates: string[] = [];

        const checkStatus = await db.query(
            `
                    SELECT RequestStatusId FROM requeststatus
                    WHERE RequestStatusName = $1;  
                `,
            [Status]
        )
            if (checkStatus.rows.length === 0){
                return res.status(400).json({ message:"Status name doesn't exist" })
            }
            const StatusId = checkStatus.rows[0].requeststatusid;

        const checkDepartment = await db.query(`
                SELECT DepartmentId FROM department
                WHERE DepartmentName = $1;
            `, [DepartmentName])
        if (checkDepartment.rows.length === 0){
            return res.status(400).json({ message:"Department name not found" })
        }
            const DepartmentId = checkDepartment.rows[0].departmentid;
            const values: any[] = [];
            let index = 1;

            if (Reason !== undefined){
                updates.push(`Reason = $${index++}`)
                values.push(Reason)
            }
            if (RequestDate !== undefined){
                updates.push(`RequestDate = $${index++}`)
                values.push(RequestDate)
            }
            if (RecieveDate !== undefined){
                updates.push(`RecieveDate = $${index++}`)
                values.push(RecieveDate)
            }
            if (StatusId !== undefined){
                updates.push(`StatusId = $${index++}`)
                values.push(StatusId)
            }
            if (RequesterName !== undefined){
                updates.push(`RequesterName = $${index++}`)
                values.push(RequesterName)
            }
            if (DepartmentId !== undefined){
                updates.push(`DepartmentId = $${index++}`)
                values.push(DepartmentId)
            }
            if (Cost !== undefined){
                updates.push(`Cost = $${index++}`)
                values.push(Cost)
            }

            values.push(RequestId);
            const result = await db.query(`
                UPDATE request 
                SET ${updates.join(', ')}
                WHERE RequestId = $${index};
          `, values)

          if (result.rowCount === 0){
            return res.status(404).json({ message:'Request Id not found' })
          }

          res.status(200).json({
            message: "Successfully updated request status",
            RequestId,
          })
    } catch (error: any){
        console.error('Failed to update request', error);
        res.status(500).json({ message:'Failed to update device request' })
    }

};

export const deleteRequest = async (req: Request, res: Response) => {
    const { id } = req.params;
    const RequestId = Number(id);

    if (isNaN(RequestId) || RequestId <= 0){
        return res.status(400).json({ message:"Invalid Id" })
    }

    try{
        const result = await db.query(`
                        DELETE FROM request
                        WHERE RequestId = $1;
                    `, [RequestId])
        if (result.rowCount === 0){
            return res.status(400).json({ message:"Request ID not found" })
        }

        res.status(200).json({ 
            message:"Successfully Delete Request",
            RequestId,
         })
        
    } catch(error: any){
        console.error('Failed to delete request');
        res.status(500).json({ message:"Failed to delete device request" })
    }
}
