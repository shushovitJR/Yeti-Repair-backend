import { Request, Response } from 'express';
import sql from '../config/db';

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
        const request = new sql.Request();
        const postQuery = `
            INSERT INTO repairstatus(RepairStatusName, Color, StatusDescription)
            VALUES (@RepairStatusName, @Color, @StatusDescription)
            SELECT SCOPE_IDENTITY() AS RepairStatusId;
        `;
        const result = await request.input('RepairStatusName', statusName)
                .input('Color', statusColor)
                .input('StatusDescription', statusDescription).query(postQuery);
        
        const statusId = result.recordset[0]?.RepairStatusId;
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
        const request = new sql.Request();
        const result = await request.query(`
            SELECT RepairStatusId, RepairStatusName, StatusDescription, Color
            FROM repairstatus;
        `);
        const statuses = result.recordset.map((row: any)=>({
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
        const request = new sql.Request();
        const updates: string[] = [];

        if (statusName !== undefined){
            updates.push('RepairStatusName = @RepairStatusName');
            request.input('RepairStatusName', statusName);
        }
        if (statusDescription !== undefined){
            updates.push('StatusDescription = @StatusDescription');
            request.input('StatusDescription', statusDescription);
        }
        if (statusColor !== undefined){
            updates.push('Color = @Color');
            request.input('Color', statusColor);
        }
        const result = await request.input('RepairStatusId', statusId)
            .query(`
                UPDATE repairstatus
                SET ${updates.join(', ')}
                WHERE RepairStatusId = @RepairStatusId;
            `)
        
        if (result.rowsAffected[0] === 0){
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
        const request = new sql.Request();
        const result = await request.input('RepairStatusId', statusId)
            .query(`
                DELETE FROM repairstatus
                WHERE RepairStatusId = @RepairStatusId;
                `)
        if (result.rowsAffected[0]===0){
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