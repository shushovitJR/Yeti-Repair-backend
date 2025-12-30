import { Request, Response} from 'express';
import sql from '../config/db';

export const createDevice = async (req: Request, res: Response)=>{
    const{
        DeviceCatName,
        DeviceDescription
    } = req.body;

    if (!DeviceCatName){
        return res.status(400).json({ message:"Missing required fields" });
    }

    const normalizedDescription = DeviceDescription && DeviceDescription.trim() !== '' ? DeviceDescription : null;

    try{
        const request = new sql.Request();
        if (normalizedDescription === null){
            const result = await request
            .input('DeviceCatName', DeviceCatName)
            .query(`
                INSERT INTO devicecat(DeviceCatName)
                VALUES (@DeviceCatName);

                SELECT SCOPE_IDENTITY() AS DeviceCatId;    
                `) 
                const newDeviceId = result.recordset[0]?.DeviceCatId;
                res.status(200).json({
                message:"Category Created Successfully",
                DeviceCategoryId:newDeviceId,
            });

        } else
    {    const result = await request
            .input('DeviceCatName', DeviceCatName)
            .input('DeviceDescription', normalizedDescription)
            .query(`
                INSERT INTO devicecat(DeviceCatName, DeviceDescription)
                VALUES (@DeviceCatName, @DeviceDescription);

                SELECT SCOPE_IDENTITY() AS DeviceCatId;    
                `) 
            const newDeviceId = result.recordset[0]?.DeviceCatId;
            res.status(200).json({
                message:"Category Created Successfully",
                DeviceCategoryId:newDeviceId,
            });
            }
        
        


    } catch (error: any){
        console.error("Error creating device category",error);
        res.status(500).json({ message:"Failed to create device category" });
    }
};  

export const getDevices = async (req: Request, res: Response)=>{
    try{
        const request = new sql.Request();
        const result = await request.query(`
                SELECT DeviceCatId, DeviceCatName, DeviceDescription FROM devicecat;
            `);

            const devices = result.recordset.map((row: any)=>({
                DeviceCategoryId: row.DeviceCatId,
                DeviceCategoryName: row.DeviceCatName,
                DeviceDescription: row.DeviceDescription,
            }));
            res.status(200).json(devices);
    } catch (error: any){
        console.error('Failed to get Devices',error);
        res.status(500).json({ message:'Could not get Device Categories', });
    }
}

export const updateDevice = async (req: Request, res: Response)=>{

    const { id } = req.params;
    const DeviceCatId = Number(id);

    if (isNaN(DeviceCatId) || DeviceCatId <= 0){
        return res.status(400).json({ message:'Invalid Device Category Id' });
    }

    const {
        DeviceCatName,
        DeviceDescription
    } = req.body;

    if (DeviceCatName===undefined && DeviceDescription===undefined){
        return res.status(400).json({ message:'Missing required field', })
    }

    try{
        const request = new sql.Request();
        let updates: string[] = [];

        if (DeviceCatName !== undefined){
            updates.push("DeviceCatName = @DeviceCatName");
            request.input('DeviceCatName', DeviceCatName);
        }
        if (DeviceDescription !== undefined){
            updates.push("DeviceDescription = @DeviceDescription");
            request.input('DeviceDescription', DeviceDescription);
        }
        request.input('DeviceCatId', DeviceCatId);  

        const query = `
            UPDATE devicecat
            SET ${updates.join(', ')}
            WHERE DeviceCatId = @DeviceCatId
        `;

        const result = await request.query(query);

        if (result.rowsAffected[0]===0){
            return res.status(404).json({ message:"Device Category not found" });
        }

        res.status(200).json({
            message:'Successfully edited Category',
            DeviceCategoryId: DeviceCatId,
        });

    } catch (error: any){
        console.error('Failed to edit Category', error);
        res.status(500).json({ message:'Error editing Category' });
    }
};

export const deleteDevice = async (req: Request, res: Response)=>{
    const { id } = req.params;
    const DeviceCatId = Number(id);

    if (isNaN(DeviceCatId) || DeviceCatId <= 0){
        return res.status(400).json({ message:'Invalid Category Id' });
    }

    try{
        const request = new sql.Request();
        request.input("DeviceCatId", DeviceCatId);
        const result = await request.query(`
                DELETE FROM devicecat
                WHERE DeviceCatId = @DeviceCatId;  
            `)

        if (result.rowsAffected[0]===0){
            return res.status(404).json({ message:"Device category not found" });
        }

        res.status(200).json({ 
            message: "Succesfully deleted the device",
            DeviceCatId,
         });


    } catch (error: any){
        console.error("Failed deleting device",error);
        res.status(500).json({ message:"Failed to delete the device" });
    }
};