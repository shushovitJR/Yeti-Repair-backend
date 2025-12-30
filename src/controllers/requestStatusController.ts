import { Request, Response } from 'express';
import sql from '../config/db';

export const createStatus = async (req: Request, res: Response)=>{
    const{
        statusName,
        statusDescription,
        statusColor
    } = req.body;

    if ( !statusName && !statusDescription && !statusColor ){
        return res.status(400).json({ message:'Missing required fields', });
    }

    if (statusName !== undefined && (typeof statusName !== 'string' || statusName.trim() === '' )){
        return res.status(400).json({ message:"Status Name must not be empty" });
    }
    if (statusDescription !== undefined && (typeof statusDescription !== 'string' || statusDescription.trim() === '' )){
        return res.status(400).json({ message:"Status Description must not be empty" });
    }
    if (statusColor !== undefined && !/^#[0-9A-Fa-f]{6}$/.test(statusColor.trim())) {
    return res.status(400).json({ message: 'Invalid color format. Use #RRGGBB' });
    } 

    try{
        const request = new sql.Request();
        const result = await request
        .input('RequestStatusName', statusName)
        .input('StatusDescription', statusDescription)
        .input('Color', statusColor)
        .query(`
                INSERT INTO requeststatus (RequestStatusName, StatusDescription, Color)
                VALUES (@RequestStatusName, @StatusDescription, @Color)

                SELECT SCOPE_IDENTITY() AS RequestStatusId;
            `);
        if (result.rowsAffected[0]===0){
            return res.status(404).json({ message:"Request status not found" });
        }
        const statusId = result.recordset[0]?.RequestStatusId;

        res.status(200).json({ 
            message: "Successfully created status",
            statusId,
         })
    } catch(error: any){
        console.error('Failed to create status',error);
        res.status(500).json({ message:'Cannot create request' });
    }
}

export const getStatuses = async (req: Request, res: Response)=>{
    try{
        const request = new sql.Request();
        const result = await request.query(`
                SELECT RequestStatusId, RequestStatusName, StatusDescription, Color
                FROM requeststatus
            `);

        const statuses = result.recordset.map((row: any)=>({
            RequestStatusId: row.RequestStatusId,
            RequestStatusName: row.RequestStatusName,
            StatusDescription: row.StatusDescription,
            Color: row.Color
        }));

        res.status(200).json(statuses);
        
    } catch (error: any){
        console.error('Failed to get request status', error);
        res.status(500).json({ message:'Could not get status' })
    }
}

export const updateStatus = async (req: Request, res: Response)=>{
    const { id } = req.params;
    const statusId = Number(id);
    if (isNaN(statusId) || statusId <= 0){
        return res.status(400).json({ message:"Invalid Id" });
    }
    const{
        statusName,
        statusDescription,
        statusColor
    } = req.body;

    if (!statusName && !statusColor && !statusDescription){
        return res.status(400).json({ message:"Fill atleast one field" });
    }
    if (statusName !== undefined && (typeof statusName !== 'string' || statusName.trim() === '' )){
        return res.status(400).json({ message:"Status Name must not be empty" });
    }
    if (statusDescription !== undefined && (typeof statusDescription !== 'string' || statusDescription.trim() === '' )){
        return res.status(400).json({ message:"Status Description must not be empty" });
    }
    if (statusColor !== undefined && !/^#[0-9A-Fa-f]{6}$/.test(statusColor.trim())) {
        return res.status(400).json({ message: 'Invalid color format. Use #RRGGBB' });
    } 

    try{
        const request = new sql.Request();
        const updates: string[] = [];
        if (statusName!== undefined){
            updates.push('RequestStatusName = @RequestStatusName');
            request.input('RequestStatusName', statusName);
        }
        if (statusDescription!== undefined){
            updates.push('StatusDescription = @StatusDescription');
            request.input('StatusDescription', statusDescription);
        }
        if (statusColor!== undefined){
            updates.push('Color = @Color');
            request.input('Color', statusColor);
        }

        const result = await request.input('RequestStatusId', statusId).query(`
                UPDATE requeststatus 
                SET ${updates.join(', ')}
                WHERE RequestStatusId = @RequestStatusId
            `);
        if (result.rowsAffected[0]===0){
            return res.status(404).json({ message:"Could not find the request status" });
        }

        res.status(200).json({ 
            message:'Successfully changed status',
            statusId,
        })
        
    } catch (error: any){
        console.error('Failed to change status', error);
        res.status(500).json({ message:'Failed to edit status' });
    }
}

export const deleteStatus = async (req: Request, res: Response)=>{
    const { id } = req.params;
    const statusId = Number(id);
    if (isNaN(statusId) || statusId <= 0){
        return res.status(400).json({ message:'Invalid Id' });
    }
    try{
        const request = new sql.Request();
        const result = await request.input('RequestStatusId', statusId)
            .query(`
                    DELETE FROM requeststatus
                    WHERE RequestStatusId = @RequestStatusId; 
                `);
        if (result.rowsAffected[0]===0){
            return res.status(404).json({ message:"Could not find request id" });
        }

        res.status(200).json({ message:"Successfully deleted status", statusId });

    } catch (error: any){
        console.error('Failed to delete status',error);
        res.status(500).json({ message:"Could not delete status" });
    }
}