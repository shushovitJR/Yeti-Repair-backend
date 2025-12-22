import {Request, Response} from 'express';
import sql from '../config/db';
import { AuthRequest } from '../middlewares/authMiddleware';

export const createRequest = async (req: AuthRequest, res: Response)=>{
    const {
        DeviceCategory,
        DeviceName,
        Reason,
        // RequestedBy = 1,
        RequestStatus = 'Pending',
    } = req.body;
    const RequestedBy = req.user?.UserId;

    if (!DeviceCategory || !DeviceName || !RequestedBy || !Reason){
        return res.status(400).json({
            message: 'Missing required fields',
        });
    }

    try{
        let DeviceId: number;

        const checkRequest = new sql.Request();
        const deviceCheck = await checkRequest
            .input('DeviceName', DeviceName)
            .input('Devicecategory', DeviceCategory)
            .query(`
                SELECT DeviceId 
                FROM device 
                WHERE DeviceName = @DeviceName 
                AND DeviceCategory = @DeviceCategory
                `);
        if (deviceCheck.recordset.length > 0){
            DeviceId = deviceCheck.recordset[0].DeviceId;
        } else {
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

        const today = new Date();
        const formatteddate = today.toISOString().split('T')[0];

        const deviceRequest = new sql.Request();
        const result = await deviceRequest
            .input('DeviceId', DeviceId)
            .input('RequestDate', formatteddate)
            .input('Reason', Reason)
            .input('RequestedBy', RequestedBy)
            .input('RequestStatus', RequestStatus)
            .query(`
                INSERT INTO request
                (DeviceId, RequestDate, Reason, RequestedBy, RequestStatus)
                VALUES
                (@DeviceId, @RequestDate, @Reason, @RequestedBy, @RequestStatus);

                SELECT SCOPE_IDENTITY() AS RequestId;
                `);

                const newRequestId = result.recordset[0]?.RequestId;

                res.status(201).json({
                    message: 'Request Created Successfully',
                    RequestId: newRequestId,
                    DeviceId: DeviceId,
                });
    } catch (error: any){
        console.error('Error creating request:', error);
        res.status(500).json({
            message: 'Failed to create device request',
        });
    }
};

export const getRequest = async (req: Request, res: Response)=>{
    try{
        const request = new sql.Request();

        const result = await request.query(`
           SELECT
           r.RequestId,
           r.RequestDate,
           r.Reason,
           r.RequestStatus AS Status,
           d.DeviceName,
           d.DeviceCategory AS Category,
            u.EmployeeName AS Name,
            e.DepartmentName AS Department

            FROM request r
            INNER JOIN device d ON r.DeviceId = d.DeviceId
            INNER JOIN users u ON r.RequestedBy = u.UserId
            INNER JOIN department e ON u.DepartmentId = e.DepartmentId
            ORDER BY r.RequestDate DESC;
            `);

            const requests = result.recordset.map((row: any) =>({
                RequestId: `REQ${String(row.RequestId).padStart(3, '0')}`,
                DeviceName: row.DeviceName,
                Category: row.Category,
                RequestDate: row.RequestDate ? row.RequestDate.toISOString().split('T')[0] : null,
                Reason: row.Reason,
                Status: row.Status,
                RequestedBy: row.Name,
                Department: row.Department,
            }));

            res.status(200).json(requests);
    } catch (error: any){
        console.error('Error fetching requests from db:', error);
        res.status(500).json({
            message: 'Failed to fetch requests from db',
        });
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

type UpdateFields = {
    Reason?: string;
    RequestStatus?: string;
};

const VALID_STATUSES = ['Pending', 'Received', 'On Hold', 'Canceled'];

export const updateRequest = async (req: AuthRequest, res: Response) => {
  // Get ID from URL params (e.g., /requests/:id)
  const { id } = req.params;
  const RequestId = Number(id);

  if (isNaN(RequestId) || RequestId <= 0) {
    return res.status(400).json({ message: 'Invalid request ID' });
  }

  const { Reason, RequestStatus } = req.body as UpdateFields;

  // Check if at least one field is provided
  if (Reason === undefined && RequestStatus === undefined) {
    return res.status(400).json({ message: 'No fields provided to update' });
  }

  // Validate status if provided
  if (RequestStatus !== undefined && !VALID_STATUSES.includes(RequestStatus)) {
    return res.status(400).json({
      message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
    });
  }

  try {
    const request = new sql.Request();

    let updateQuery = 'UPDATE request SET ';
    const updates: string[] = [];
    const params: Record<string, any> = {};

    if (Reason !== undefined) {
      updates.push('Reason = @Reason');
      params.Reason = Reason;
    }
    if (RequestStatus !== undefined) {
      updates.push('RequestStatus = @RequestStatus');
      params.RequestStatus = RequestStatus;
    }

    updateQuery += updates.join(', ');
    updateQuery += ' WHERE RequestId = @RequestId';

    // Add all inputs
    request.input('RequestId', RequestId);
    Object.keys(params).forEach((key) => {
      request.input(key, params[key]);
    });

    const result = await request.query(updateQuery);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Request not found' });
    }

    res.status(200).json({
      message: 'Repair request updated successfully',
      RequestId,
    });
  } catch (error: any) {
    console.error('Error updating request:', error);
    res.status(500).json({ message: 'Failed to update repair request' });
  }
};