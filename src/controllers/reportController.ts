import { Request, Response } from 'express';
import sql from '../config/db';

export const reportTable_Repair = async (req: Request, res: Response) => {
    try{
        const request = new sql.Request();
        const result = await request.query(`
                SELECT
                    dc.DeviceCatName AS category,
                    COUNT(r.RepairId) AS total,
                    SUM(CASE WHEN rs.RepairStatusName IN ('Recieved', 'Repaired') THEN 1 ELSE 0 END) AS completed,
                    SUM(CASE WHEN rs.RepairStatusName NOT IN ('Recieved', 'Repaired') THEN 1 ELSE 0 END) AS pending
                FROM repair r 
                JOIN device d ON r.DeviceId = d.DeviceId
                JOIN devicecat dc ON d.Category = dc.DeviceCatId
                JOIN repairstatus rs ON r.StatusId = rs.RepairStatusId
                GROUP BY dc.DeviceCatName;
            `)
        const repairs = result.recordset.map((row)=>({
            category: row.category,
            total: row.total,
            completed: row.completed,
            pending: row.pending,
            completionpercent: ((row.completed/row.total) * 100).toFixed(0)+'%',
        }))
        res.status(200).json(repairs);
    } catch (error: any){
        console.error("Failed to fetch repair report table", error)
        res.status(500).json({ message:"Failed to load report table for repair" })
    }

}

export const reportTable_Request = async (req: Request, res: Response) => {
    try{
        const request = new sql.Request();
        const result = await request.query(`
                SELECT
                    dc.DeviceCatName AS category,
                    COUNT(rs.RequestStatusId) AS total,
                    SUM(CASE WHEN rs.RequestStatusName IN ('Recieved') THEN 1 ELSE 0 END) AS completed,
                    SUM(CASE WHEN rs.RequestStatusName NOT IN ('Recieved') THEN 1 ELSE 0 END) AS pending
                    FROM request r
                    JOIN device d ON r.DeviceId = d.DeviceId
                    JOIN devicecat dc ON d.Category = dc.DeviceCatId
                    JOIN requeststatus rs ON r.StatusId = rs.RequestStatusId
                    GROUP BY dc.DeviceCatName;
            `);
        const requests = result.recordset.map((row)=>({
            catgory: row.category,
            total: row.total,
            completed: row.completed,
            pending: row.pending,
            completionpercent: ((row.completed/row.total)*100).toFixed(0)+'%',
        }))

        res.status(200).json(requests);

    } catch (error: any){
        console.error("Failed to get request report table", error);
        res.status(500).json({ message:"Failed to get report table for requets" })
    }
}

export const repairSummary = async (req: Request, res: Response) => {
    try{
        const request = new sql.Request();
        const result = await request.query(`
                        SELECT
            COUNT(r.RepairId) AS totalrepairs,
            AVG(DATEDIFF(DAY, r.IssueDate, r.ReturnDate)) AS repairtime,
            SUM(CASE WHEN rs.RepairStatusName IN ('Recieved', 'Repaired') THEN 1 ELSE 0 END) AS completed,

                SUM(CASE 
                WHEN MONTH(r.IssueDate) = MONTH(GETDATE()) 
                AND YEAR(r.IssueDate) = YEAR(GETDATE()) 
                THEN 1 ELSE 0 
            END) AS this_month_repairs,
            
            -- Last month's repairs
            SUM(CASE 
                WHEN MONTH(r.IssueDate) = MONTH(DATEADD(MONTH, -1, GETDATE())) 
                AND YEAR(r.IssueDate) = YEAR(DATEADD(MONTH, -1, GETDATE())) 
                THEN 1 ELSE 0 
            END) AS last_month_repairs


            FROM repair r
            JOIN repairstatus rs ON r.StatusId = rs.RepairStatusId;
            `)
        const row = result.recordset[0];
        const thisMonth = row.this_month_repairs;
        const lastMonth = row.last_month_repairs;
        let percentChange = 0;
        if (lastMonth>0){
            percentChange = ((thisMonth-lastMonth)/lastMonth) * 100;
        }

        const stats = {
            totalrepairs: row.totalrepairs,
            repairtime: row.repairtime.toFixed(2),
            completed: row.completed,
            percentchange: percentChange.toFixed(2)+"%",
        }

        res.status(200).json(stats);
    } catch (error: any){
        console.error("Failed to get repair summary", error);
        res.status(500).json({ message:"Failed to fetch repair summary" })
    }
}

export const requestSummary = async (req: Request, res: Response) => {
    try{
        const request = new sql.Request();
        const result = await request.query(`
                SELECT 
            COUNT(RequestId) AS totalrequests,
            SUM(CASE WHEN MONTH(RequestDate) = MONTH(GETDATE())
                AND YEAR(RequestDate) = YEAR(GETDATE()) THEN 1 ELSE 0 END) AS this_month_request,

            SUM(CASE WHEN MONTH(RequestDate) = MONTH(DATEADD(MONTH, -1, GETDATE())) AND
                YEAR(RequestDate) = YEAR(DATEADD(MONTH, -1, GETDATE())) THEN 1 ELSE 0 END) AS last_month_request
                
                FROM request;
            `)
        const row = result.recordset[0];
        const thisMonth = row.this_month_request;
        const lastMonth = row.last_month_request;

        let percentChange = 0;

        if (lastMonth>0){
            percentChange = ((thisMonth-lastMonth)/lastMonth) * 100;
        }
        const stats = {
            totalrequests : row.totalrequests,
            percentchange: percentChange,
        }

        res.status(200).json(stats)
    } catch (error: any){
        console.error("Failed to get request summary", error);
        res.status(500).json({ message:"Failed to fetch request summary" })
    }
}

export const deviceCategoryChart = async (req: Request, res: Response) => {
    try{
        const request = new sql.Request();
        const result = await request.query(`
                SELECT 
                dc.DeviceCatName AS category,
                COUNT(dc.DeviceCatName) AS count
                FROM device d
                JOIN devicecat dc ON d.Category = dc.DeviceCatId
                GROUP BY dc.DeviceCatName;
            `)
        const categories = result.recordset.map((row)=>({
            category: row.category,
            count: row.count,
        }))

        res.status(200).json(categories);
    } catch (error: any){
        console.error("Failed to get catgory count", error);
        res.status(500).json({ message:"Failed to fetch category count" });
    }
}

export const requestMetric = async (req: Request, res: Response) => {
    try{
        const request = new sql.Request();
        const result = await request.query(`
                SELECT
                SUM(CASE WHEN s.RequestStatusName = 'Recieved' THEN 1 ELSE 0 END) AS recieved,
                SUM(CASE WHEN s.RequestStatusName NOT IN ('Recieved', 'Cancelled') THEN 1 ELSE 0 END) AS pending
                FROM request r
                JOIN requeststatus s ON r.StatusId = s.RequestStatusId;
            `)
        const requests = result.recordset.map((row)=>({
            recieved: row.recieved,
            pending: row.pending,
        }))

        res.status(200).json(requests);
    } catch (error: any){
        console.error("Failed to get request metric", error);
        res.status(500).json({ message:"Failed to fetch request metric" });
    }
}

export const repairMetric = async (req: Request, res: Response) => {
    try {const request = new sql.Request();
    const result = await request.query(`
                    SELECT
            SUM(CASE WHEN s.RepairStatusName NOT IN ('Recieved','Repaired','Cancelled') THEN 1 ELSE 0 END) AS underrepair,
            SUM(CASE WHEN MONTH(r.IssueDate)=MONTH(GETDATE())
                AND YEAR(r.IssueDate)=YEAR(GETDATE()) THEN r.cost ELSE 0 END ) AS cost
            FROM repair r
            JOIN repairstatus s ON r.StatusId = s.RepairStatusId;  
        `)
    const repairs = result.recordset[0];
    res.status(200).json(repairs)
        } catch (error: any){
            console.error('Failed to get repair metric', error)
            res.status(500).json({ message:"Failed to fetch repair metric" })
        }
}