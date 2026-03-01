import { Request, Response } from 'express';
import db from '../config/db.js';

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
        const result = await db.query(
            `
                INSERT INTO requeststatus (RequestStatusName, StatusDescription, Color)
                VALUES ($1, $2, $3)
                RETURNING RequestStatusId AS "RequestStatusId";
            `,
            [statusName, statusDescription, statusColor]
        );
        if (result.rowCount===0){
            return res.status(404).json({ message:"Request status not found" });
        }
        const statusId = result.rows[0]?.RequestStatusId;

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
        const result = await db.query(`
                SELECT
                    RequestStatusId AS "RequestStatusId",
                    RequestStatusName AS "RequestStatusName",
                    StatusDescription AS "StatusDescription",
                    Color AS "Color"
                FROM requeststatus
                ORDER BY RequestStatusId ASC;
            `);

        const statuses = result.rows.map((row: any)=>({
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
        const updates: string[] = [];
        const values: any[] = [];
        let index = 1;
        if (statusName!== undefined){
            updates.push(`RequestStatusName = $${index++}`);
            values.push(statusName);
        }
        if (statusDescription!== undefined){
            updates.push(`StatusDescription = $${index++}`);
            values.push(statusDescription);
        }
        if (statusColor!== undefined){
            updates.push(`Color = $${index++}`);
            values.push(statusColor);
        }

        values.push(statusId);
        const result = await db.query(`
                UPDATE requeststatus 
                SET ${updates.join(', ')}
                WHERE RequestStatusId = $${index}
            `, values);
        if (result.rowCount===0){
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
        const result = await db.query(`
                    DELETE FROM requeststatus
                    WHERE RequestStatusId = $1; 
                `, [statusId]);
        if (result.rowCount===0){
            return res.status(404).json({ message:"Could not find request id" });
        }

        res.status(200).json({ message:"Successfully deleted status", statusId });

    } catch (error: any){
        console.error('Failed to delete status',error);
        res.status(500).json({ message:"Could not delete status" });
    }
}
