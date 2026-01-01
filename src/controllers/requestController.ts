import {Request, Response} from 'express';
import sql from '../config/db';
import { AuthRequest } from '../middlewares/authMiddleware';

export const createRequest = async (req: AuthRequest, res: Response)=>{
    const { 
        DeviceName,
        Category,
        Reason,
        Status = 'Pending'
     } = req.body
     const UserName = req.user?.UserId;

     if (!DeviceName || !Category || !Reason){
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
            .input('DeviceId', DeviceId)
            .input('Reason', Reason)
            .input('StatusId', StatusId)
            .input('UserId', UserName)
            .query(`
                    INSERT INTO request (Reason, DeviceId, StatusId, UserId)
                    VALUES (@Reason, @DeviceId, @StatusId, @UserId)
                    
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
                u.EmployeeName,
                de.DepartmentName
                FROM request r
                LEFT JOIN requeststatus s ON r.StatusId = s.RequestStatusId
                LEFT JOIN device d ON r.DeviceId = d.DeviceId
                LEFT JOIN devicecat dc ON d.Category = dc.DeviceCatId
                LEFT JOIN users u ON r.UserId = u.UserId
                LEFT JOIN department de ON u.DepartmentId = de.DepartmentId
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

export const getRequestById = async (req: Request, res: Response)=>{
    const { id } = req.params;

    const RequestId = Number(id);
    if (isNaN(RequestId) || RequestId<=0){
        return res.status(400).json({message: 'Invalid request ID'});
    }

    try {
        const request = new sql.Request();

        const result = await request
            .input('RequestId', RequestId)
            .query(`
                SELECT
                r.RequestId,
                u.EmployeeName AS RequestedBy,
                d.DeviceCategory,
                d.DeviceName,
                r.Reason,
                r.RequestStatus AS Status,
                e.DepartmentName AS Department,
                r.RequestDate

                FROM request r
                INNER JOIN device d ON r.DeviceId = d.DeviceId
                INNER JOIN users u ON r.RequestedBy = u.UserId
                INNER JOIN department e ON u.DepartmentId = e.DepartmentId
                
                WHERE r.RequestId = @RequestId;
                `);
                if (result.recordset.length === 0){
                    return res.status(404).json({message: "Request not found"});
                }

                const row = result.recordset[0];

                const formattedRepair = {
                    RequestId: `REQ${String(row.RequestId).padStart(3, '0')}`,
                    DeviceName: row.DeviceName,
                    category: row.DeviceCategory,
                    RequestedBy: row.RequestedBy,
                    Reason: row.Reason,
                    Status: row.Status,
                    Department: row.Department,
                    RequestDate: row.RequestDate ? row.RequestDate.toISOString().split('T')[0] : null,
                };
                res.status(200).json(formattedRepair);

    } catch (error: any){
        console.error('Error fetching request by ID from db:', error);
        res.status(500).json({message: 'Failed to fetch request by id from db'});
    }
}; 

export const updateRequest = async (req: Request, res: Response) => {
  const { id } = req.params;
  const RequestId = Number(id);

  if (isNaN(RequestId) || RequestId <= 0){
    return res.status(400).json({ message:"Invalid request id" })
  }

  const {
    Reason,
    RequestDate,
    RecieveDate,
    Status,
  } = req.body;

    if (!Reason && ! RequestDate && !RecieveDate && !Status){
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