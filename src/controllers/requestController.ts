import {Request, Response} from 'express';
import sql from '../config/db';
import { AuthRequest } from '../middlewares/authMiddleware';

export const createRequest = async (req: AuthRequest, res: Response)=>{
    const { 
        RequesterName,
        DepartmentName,
        DeviceName,
        Category,
        Reason,
        Status = 'Pending'
     } = req.body
     const UserName = req.user?.UserId;

     if (!DeviceName || !Category || !Reason || !RequesterName || !DepartmentName){
        return res.status(400).json({ message:"Fill all the fields" });
     }
     if (!UserName){
        return res.status(400).json({ message:"Cannot find user" })
     }
     try{
        const request = new sql.Request();
        const checkStatus = await request.input('RequestStatusName', Status)
            .query(`
                    SELECT RequestStatusId FROM requeststatus
                    WHERE RequestStatusName = @RequestStatusName;
                `);
            if (checkStatus.recordset.length === 0){
                return res.status(400).json({ message:"Status Not Found" })
            }
            const StatusId = checkStatus.recordset[0].RequestStatusId;

        const checkDepartment = await request.input('DepartmentName', DepartmentName).query(`
                SELECT DepartmentId FROM department
                WHERE DepartmentName = @DepartmentName;
            `)
            if (checkDepartment.recordset.length === 0){
                return res.status(400).json({ message:"Department Not Found" })
            }
            const DepartmentId = checkDepartment.recordset[0].DepartmentId;

        const checkDeviceCat = await request.input('DeviceCatName', Category)
            .query(`
                    SELECT DeviceCatId from devicecat
                    WHERE DeviceCatName = @DeviceCatName
                `);

            if (checkDeviceCat.recordset.length === 0){
                return res.status(400).json({ message:"Device Category not found" });
            }
            const CategoryId = checkDeviceCat.recordset[0].DeviceCatId;

        const createDevice = await request
            .input('DeviceName', DeviceName)
            .input('Category', CategoryId)
            .query(`
                    INSERT INTO device(DeviceName, Category)
                    VALUES (@DeviceName, @Category);

                    SELECT SCOPE_IDENTITY() AS DeviceId
                `);
            const DeviceId = createDevice.recordset[0].DeviceId;

        const result = await request
            .input('RequesterName', RequesterName)
            .input('DeviceId', DeviceId)
            .input('Reason', Reason)
            .input('StatusId', StatusId)
            .input('UserId', UserName)
            .input('DepartmentId', DepartmentId)
            .query(`
                    INSERT INTO request (RequesterName, Reason, DeviceId, StatusId, UserId, DepartmentId)
                    VALUES (@RequesterName, @Reason, @DeviceId, @StatusId, @UserId, @DepartmentId)
                    
                    SELECT SCOPE_IDENTITY() AS RequestId;
                `)
            const RequestId = result.recordset[0].RequestId;

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
        const request = new sql.Request();
        const result = await request.query(`
                SELECT 
                r.RequestId,
                r.Reason,
                r.RequestDate,
                r.RecieveDate,
                s.RequestStatusName,
                s.Color,
                d.DeviceName,
                dc.DeviceCatName,
                r.RequesterName AS EmployeeName,
                de.DepartmentName
                FROM request r
                LEFT JOIN requeststatus s ON r.StatusId = s.RequestStatusId
                LEFT JOIN device d ON r.DeviceId = d.DeviceId
                LEFT JOIN devicecat dc ON d.Category = dc.DeviceCatId
                LEFT JOIN department de ON r.DepartmentId = de.DepartmentId
                ORDER BY 
                    r.RequestId DESC;
            `);
        const requests = result.recordset.map((row: any)=>({
            RequestId: `REQ${String(row.RequestId).padStart(3, '0')}`,
            Reason: row.Reason,
            RequestDate: row.RequestDate ? row.RequestDate.toISOString().split('T')[0] : null,
            RecieveDate: row.RecieveDate ? row.RecieveDate.toISOString().split('T')[0] : null,
            Status: row.RequestStatusName,
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
    RequestDate,
    RecieveDate,
    Status,
  } = req.body;

    if (!Reason && ! RequestDate && !RecieveDate && !Status && !RequesterName && !DepartmentName){
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
        const request = new sql.Request();
        const updates: string[] = [];

        const checkStatus = await request.input('RequestStatusName', Status)
            .query(`
                    SELECT RequestStatusId FROM requeststatus
                    WHERE RequestStatusName = @RequestStatusName;  
                `)
            if (checkStatus.recordset.length === 0){
                return res.status(400).json({ message:"Status name doesn't exist" })
            }
            const StatusId = checkStatus.recordset[0].RequestStatusId;

        const checkDepartment = await request.input('DepartmentName', DepartmentName).query(`
                SELECT DepartmentId FROM department
                WHERE DepartmentName = @DepartmentName;
            `)
        if (checkDepartment.recordset.length === 0){
            return res.status(400).json({ message:"Department name not found" })
        }
            const DepartmentId = checkDepartment.recordset[0].DepartmentId;

            if (Reason !== undefined){
                updates.push('Reason = @Reason')
                request.input('Reason', Reason)
            }
            if (RequestDate !== undefined){
                updates.push('RequestDate = @RequestDate')
                request.input('RequestDate', RequestDate)
            }
            if (RecieveDate !== undefined){
                updates.push('RecieveDate = @RecieveDate')
                request.input('RecieveDate', RecieveDate)
            }
            if (StatusId !== undefined){
                updates.push('StatusId = @StatusId')
                request.input('StatusId', StatusId)
            }
            if (RequesterName !== undefined){
                updates.push('RequesterName = @RequesterName')
                request.input('RequesterName', RequesterName)
            }
            if (DepartmentId !== undefined){
                updates.push('DepartmentId = @DepartmentId')
                request.input('DepartmentId', DepartmentId)
            }

            const result = await request.input('RequestId',RequestId).query(`
                UPDATE request 
                SET ${updates.join(', ')}
                WHERE RequestId = @RequestId;
          `)

          if (result.rowsAffected[0] === 0){
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
        const request = new sql.Request();
        const result = await request.input('RequestId', RequestId)
                .query(`
                        DELETE FROM request
                        WHERE RequestId = @RequestId;
                    `)
        if (result.rowsAffected[0] === 0){
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