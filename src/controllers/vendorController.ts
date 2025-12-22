import { Request, Response } from 'express';
import sql from '../config/db';

export const addVendor = async (req: Request, res: Response)=>{
    const{
        VendorName,
    } = req.body;

    if (!VendorName){
        return res.status(400).json({
            message: 'Vendor Name is required',
        });
    }
    try{
        const vendorAdd = new sql.Request();
        const result = await vendorAdd
            .input('VendorName', VendorName)
            .query(`
                INSERT INTO vendor (VendorName)
                VALUES (@VendorName);

                SELECT SCOPE_IDENTITY() AS VendorId;
                `);

        const newVendorId = result.recordset[0]?.VendorId;
        
        res.status(201).json({
            message: 'Request Created Successfully',
            VendorId: newVendorId,
        });
    } catch (error: any){
        console.error('Error creating vendor:',error);
        res.status(500).json({
            message: 'Failed to create vendor',
        });
    }
};

export const getVendors = async (req: Request, res: Response)=>{
    try{
        const getVendor = new sql.Request();

        const result = await getVendor.query(`
                SELECT VendorName FROM vendor;
            `);

            res.status(200).json({
                vendors: result.recordset,
            });
    } catch (error: any){
        console.error('Error fetching vendors from db:', error);
        res.status(500).json({
            message: 'Failed to fetch vendors from db',
        });
    }
};

export const deleteVendor = async (req: Request, res: Response)=>{
    const { id } = req.params;
    const VendorId = Number(id);

    if (isNaN(VendorId) || VendorId <= 0){
        return res.status(400).json({ message: 'Invalid Vendor ID' });
    }

    try{
        const request = new sql.Request();

        const checkQuery = `
        SELECT COUNT(*) AS count
        FROM repair
        WHERE VendorId = @VendorId`;
        request.input('VendorId', VendorId);
        const checkResult = await request.query(checkQuery);

        const repairCount = checkResult.recordset[0].count;

        if (repairCount > 0) {
            return res.status(400).json({
                message: `Cannot delete vendor with associated repairs. It is associated with ${repairCount}`,
            });
        }
        const deleteQuery = `
        DELETE FROM vendor
        WHERE VendorId = @VendorId`;

        const deleteResult = await request.query(deleteQuery);

        if (deleteResult.rowsAffected[0] === 0){
            return res.status(404).json({ message: 'Vendor not found' });
        }

        res.status(200).json({
            message: 'Vendor deleted successfully',
            VendorId,
        });
    } catch (error: any){
        console.error('Error deleting vendor:', error);
        res.status(500).json({message: 'Failed to delete vendor'});
    }

};