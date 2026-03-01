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
                INSERT INTO supportstatus (supportstatusname, description, color)
                VALUES($1,$2,$3)
                RETURNING supportstatusid AS "SupportStatusId";
            `,
            [statusName,statusDescription,statusColor]
        );
        if (result.rowCount===0){
            return res.status(404).json({ message:"Support status not found" });
        }
        const statusId = result.rows[0]?.SupportStatusId;

        res.status(200).json({
            message: "Successfully created status",
            statusId,
        })

    } catch (error: any){
        console.error('Failed to create status', error);
        res.status(500).json({ message:'Cannot create request' });
    }
}

export const getStatuses = async (req: Request, res: Response)=>{
    try{
        const result = await db.query(`
                SELECT 
                      supportstatusid AS "SupportStatusId",
                      supportstatusname AS "SupportStatusName",
                      description AS "Description",
                      color AS "Color"
                    FROM supportstatus
                    ORDER BY supportstatusid ASC;
            `);

        const statuses = result.rows.map((row: any)=>({
            SupportStatusId: row.SupportStatusId,
            SupportStatusName: row.SupportStatusName,
            StatusDescription: row.Description,
            Color: row.Color
        }));

        res.status(200).json(statuses);

    } catch (error: any){
        console.error('Failed to get support status', error);
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
            updates.push(`supportstatusname = $${index++}`);
            values.push(statusName);
        }
        if (statusDescription!== undefined){
            updates.push(`description = $${index++}`);
            values.push(statusDescription);
        }
        if (statusColor!== undefined){
            updates.push(`color = $${index++}`);
            values.push(statusColor);
        }

        values.push(statusId);
        const result = await db.query(`
                UPDATE supportstatus 
                SET ${updates.join(', ')}
                WHERE supportstatusid = $${index}
            `, values);
        if (result.rowCount===0){
            return res.status(404).json({ message:"Could not find the support status" });
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
                DELETE from supportstatus
                WHERE supportstatusid = $1 
            `, [statusId]); 
        if (result.rowCount===0){
            return res.status(404).json({ message:"Could not find support id" });
        }

        res.status(200).json({ message:"Successfully deleted status", statusId });
    } catch (error: any){
        console.error('Failed to delete status',error);
        res.status(500).json({ message:"Could not delete status" });
    }
}