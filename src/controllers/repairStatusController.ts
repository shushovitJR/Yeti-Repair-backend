import { Request, Response } from 'express';
import db from '../config/db.js';

export const createStatus = async (req: Request, res: Response)=>{
    const {
        statusName,
        statusColor,
        statusDescription,
    } = req.body;

      if (
        typeof statusName !== 'string' || !statusName.trim() ||
        typeof statusColor !== 'string' || !statusColor.trim() ||
        typeof statusDescription !== 'string' || !statusDescription.trim()
  ){
    return res.status(400).json({
      message: 'Fill all the required fields'
    });
};

    try{
        const result = await db.query(
            `
            INSERT INTO repairstatus(RepairStatusName, Color, StatusDescription)
            VALUES ($1, $2, $3)
            RETURNING RepairStatusId AS "RepairStatusId";
        `,
            [statusName, statusColor, statusDescription]
        );
        
        const statusId = result.rows[0]?.RepairStatusId;
        if (!statusId){
            return res.status(500).json({ message:"Status Created but could not get id" })
        }
        res.status(201).json({ 
            message:'Successfully Added Status',
            statusId,
        });
    } catch (error: any){
        console.error("Failed to create status", error);
        res.status(500).json({ message:"Could not insert the status" });
    }
}

export const getStatuses = async (req: Request, res: Response)=>{
    try{
        const result = await db.query(`
            SELECT
                RepairStatusId AS "RepairStatusId",
                RepairStatusName AS "RepairStatusName",
                StatusDescription AS "StatusDescription",
                Color AS "Color"
            FROM repairstatus
            ORDER BY RepairStatusId ASC;
        `);
        const statuses = result.rows.map((row: any)=>({
            RepairStatusId: row.RepairStatusId,
            RepairStatusName: row.RepairStatusName,
            StatusDescription: row.StatusDescription,
            Color: row.Color,
        }));

        res.status(200).json(statuses);

    } catch (error: any){
        console.error("Failed to fetch repair statuses", error);
        res.status(500).json({ message:'Failed to get repair status' });
    }
}

export const updateStatus = async (req: Request, res: Response)=>{

    const { id } = req.params;
    const statusId = Number(id);

    if ( isNaN(statusId) || statusId <= 0){
        return res.status(400).json({ message:'Invalid Id' });
    }

    const{
        statusName,
        statusDescription,
        statusColor
    } = req.body;

    if ( !statusName && !statusDescription && !statusColor ){
        return res.status(400).json({ message:'Fill atleast one field', });
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

        if (statusName !== undefined){
            updates.push(`RepairStatusName = $${index++}`);
            values.push(statusName);
        }
        if (statusDescription !== undefined){
            updates.push(`StatusDescription = $${index++}`);
            values.push(statusDescription);
        }
        if (statusColor !== undefined){
            updates.push(`Color = $${index++}`);
            values.push(statusColor);
        }
        values.push(statusId);
        const result = await db.query(`
                UPDATE repairstatus
                SET ${updates.join(', ')}
                WHERE RepairStatusId = $${index};
            `, values)
        
        if (result.rowCount === 0){
            return res.status(404).json({ message:"Repair status not found" });
        }

        res.status(200).json({ message:'Successfully updated status', statusId });

    } catch (error: any){
        console.error('Failed to edit status', error);
        res.status(500).json({ message:"Couldn't change the status" });
    }

};

export const deleteStatus = async (req: Request, res: Response)=>{
    const { id } = req.params;
    const statusId = Number(id);

    if (isNaN(statusId) || statusId <= 0){
        return res.status(400).json({ message: 'Invalid status id' });
    }
    try{
        const result = await db.query(`
                DELETE FROM repairstatus
                WHERE RepairStatusId = $1;
                `, [statusId])
        if (result.rowCount===0){
            return res.status(404).json({ message: "Repair Status not Found" });
        }
        res.status(200).json({
            message:"Successfully deleted status",
            statusId,
        })
    } catch (error: any){
        console.error('Failed to delete status',error);
        res.status(500).json({ message:"Failed to delete item" });
    }
};
