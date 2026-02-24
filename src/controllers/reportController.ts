import { Request, Response } from "express";
import db from "../config/db";

export const reportTable_Repair = async (req: Request, res: Response) => {
  try {
    const result = await db.query(`
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
            `);
    const repairs = result.rows.map((row: any) => ({
      category: row.category,
      total: Number(row.total),
      completed: Number(row.completed),
      pending: Number(row.pending),
      completionpercent: ((Number(row.completed) / Number(row.total)) * 100).toFixed(0) + "%",
    }));
    res.status(200).json(repairs);
  } catch (error: any) {
    console.error("Failed to fetch repair report table", error);
    res.status(500).json({ message: "Failed to load report table for repair" });
  }
};

export const reportTable_Request = async (req: Request, res: Response) => {
  try {
    const result = await db.query(`
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
    const requests = result.rows.map((row: any) => ({
      catgory: row.category,
      total: Number(row.total),
      completed: Number(row.completed),
      pending: Number(row.pending),
      completionpercent: ((Number(row.completed) / Number(row.total)) * 100).toFixed(0) + "%",
    }));

    res.status(200).json(requests);
  } catch (error: any) {
    console.error("Failed to get request report table", error);
    res.status(500).json({ message: "Failed to get report table for requets" });
  }
};

export const repairSummary = async (req: Request, res: Response) => {
  try {
    const result = await db.query(`
                        SELECT
            COUNT(r.RepairId) AS totalrepairs,
            AVG(r.ReturnDate - r.IssueDate) AS repairtime,
            SUM(CASE WHEN rs.RepairStatusName IN ('Recieved', 'Repaired') THEN 1 ELSE 0 END) AS completed,

                SUM(CASE 
                WHEN EXTRACT(MONTH FROM r.IssueDate) = EXTRACT(MONTH FROM CURRENT_DATE) 
                AND EXTRACT(YEAR FROM r.IssueDate) = EXTRACT(YEAR FROM CURRENT_DATE) 
                THEN 1 ELSE 0 
            END) AS this_month_repairs,
            
           
            SUM(CASE 
                WHEN EXTRACT(MONTH FROM r.IssueDate) = EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '1 month') 
                AND EXTRACT(YEAR FROM r.IssueDate) = EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month') 
                THEN 1 ELSE 0 
            END) AS last_month_repairs


            FROM repair r
            JOIN repairstatus rs ON r.StatusId = rs.RepairStatusId;
            `);
    const row = result.rows[0];
    const thisMonth = Number(row.this_month_repairs);
    const lastMonth = Number(row.last_month_repairs);
    let percentChange = 0;
    if (lastMonth > 0) {
      percentChange = ((thisMonth - lastMonth) / lastMonth) * 100;
    }

    const stats = {
      totalrepairs: Number(row.totalrepairs),
      repairtime: Number(row.repairtime ?? 0).toFixed(2),
      completed: Number(row.completed),
      percentchange: percentChange.toFixed(2),
    };

    res.status(200).json(stats);
  } catch (error: any) {
    console.error("Failed to get repair summary", error);
    res.status(500).json({ message: "Failed to fetch repair summary" });
  }
};

export const requestSummary = async (req: Request, res: Response) => {
  try {
    const result = await db.query(`
                SELECT 
            COUNT(RequestId) AS totalrequests,
            SUM(CASE WHEN EXTRACT(MONTH FROM RequestDate) = EXTRACT(MONTH FROM CURRENT_DATE)
                AND EXTRACT(YEAR FROM RequestDate) = EXTRACT(YEAR FROM CURRENT_DATE) THEN 1 ELSE 0 END) AS this_month_request,

            SUM(CASE WHEN EXTRACT(MONTH FROM RequestDate) = EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '1 month') AND
                EXTRACT(YEAR FROM RequestDate) = EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month') THEN 1 ELSE 0 END) AS last_month_request
                
                FROM request;
            `);
    const row = result.rows[0];
    const thisMonth = Number(row.this_month_request);
    const lastMonth = Number(row.last_month_request);

    let percentChange = 0;

    if (lastMonth > 0) {
      percentChange = ((thisMonth - lastMonth) / lastMonth) * 100;
    }
    const stats = {
      totalrequests: Number(row.totalrequests),
      percentchange: percentChange.toFixed(2),
    };

    res.status(200).json(stats);
  } catch (error: any) {
    console.error("Failed to get request summary", error);
    res.status(500).json({ message: "Failed to fetch request summary" });
  }
};

export const deviceCategoryChart = async (req: Request, res: Response) => {
  try {
    const result = await db.query(`
                SELECT 
                dc.DeviceCatName AS category,
                COUNT(dc.DeviceCatName) AS count
                FROM device d
                JOIN devicecat dc ON d.Category = dc.DeviceCatId
                GROUP BY dc.DeviceCatName;
            `);
    const categories = result.rows.map((row: any) => ({
      category: row.category,
      count: Number(row.count),
    }));

    res.status(200).json(categories);
  } catch (error: any) {
    console.error("Failed to get catgory count", error);
    res.status(500).json({ message: "Failed to fetch category count" });
  }
};

export const requestMetric = async (req: Request, res: Response) => {
  try {
    const result = await db.query(`
                SELECT
                SUM(CASE WHEN EXTRACT(MONTH FROM r.RequestDate)=EXTRACT(MONTH FROM CURRENT_DATE)
                  AND EXTRACT(YEAR FROM r.RequestDate)=EXTRACT(YEAR FROM CURRENT_DATE) THEN r.cost ELSE 0 END ) AS cost,
                SUM(CASE WHEN s.RequestStatusName NOT IN ('Recieved', 'Cancelled') THEN 1 ELSE 0 END) AS pending
                FROM request r
                JOIN requeststatus s ON r.StatusId = s.RequestStatusId;
            `);
    const requests = result.rows.map((row: any) => ({
      cost: Number(row.cost ?? 0),
      pending: Number(row.pending),
    }));

    res.status(200).json(requests);
  } catch (error: any) {
    console.error("Failed to get request metric", error);
    res.status(500).json({ message: "Failed to fetch request metric" });
  }
};

export const repairMetric = async (req: Request, res: Response) => {
  try {
    const result = await db.query(`
                    SELECT
            SUM(CASE WHEN s.RepairStatusName NOT IN ('Recieved','Repaired','Cancelled') THEN 1 ELSE 0 END) AS underrepair,
            SUM(CASE WHEN EXTRACT(MONTH FROM r.IssueDate)=EXTRACT(MONTH FROM CURRENT_DATE)
                AND EXTRACT(YEAR FROM r.IssueDate)=EXTRACT(YEAR FROM CURRENT_DATE) THEN r.cost ELSE 0 END ) AS cost
            FROM repair r
            JOIN repairstatus s ON r.StatusId = s.RepairStatusId;  
        `);
    const row = result.rows[0];
    const repairs = {
      underrepair: Number(row.underrepair),
      cost: Number(row.cost ?? 0),
    };
    res.status(200).json(repairs);
  } catch (error: any) {
    console.error("Failed to get repair metric", error);
    res.status(500).json({ message: "Failed to fetch repair metric" });
  }
};

export const departmentRequest = async (req: Request, res: Response) => {
  try {
    const result = await db.query(`
                SELECT 
                d.DepartmentName AS department,
                COUNT(d.DepartmentName) AS count
                FROM request r
                JOIN department d ON  r.DepartmentId = d.DepartmentId 
                GROUP BY d.DepartmentName;
            `);
    const counts = result.rows.map((row: any) => ({
      department: row.department,
      count: Number(row.count),
    }));
    res.status(200).json(counts);
  } catch (error: any) {
    console.log("Failed to get department wise request", error);
    res
      .status(500)
      .json({ message: "Failed to fetch department request count data" });
  }
};

export const monthlyRepairs = async (req: Request, res: Response) => {
  try {
    const result = await db.query(`
                            WITH months AS (
                SELECT 1 AS month, 'Jan' AS month_name UNION ALL 
                SELECT 2, 'Feb' UNION ALL SELECT 3, 'Mar' UNION ALL 
                SELECT 4, 'Apr' UNION ALL SELECT 5, 'May' UNION ALL 
                SELECT 6, 'Jun' UNION ALL SELECT 7, 'Jul' UNION ALL 
                SELECT 8, 'Aug' UNION ALL SELECT 9, 'Sep' UNION ALL 
                SELECT 10, 'Oct' UNION ALL SELECT 11, 'Nov' UNION ALL 
                SELECT 12, 'Dec'
            )
            SELECT 
                m.month_name AS month,
                SUM(CASE WHEN s.RepairStatusName IN ('Repaired','Recieved') THEN 1 ELSE 0 END) AS completed,
                COALESCE(COUNT(r.RepairId), 0) AS repairs
            FROM months m
            LEFT JOIN repair r ON m.month = EXTRACT(MONTH FROM r.IssueDate) 
                AND EXTRACT(YEAR FROM r.IssueDate) = EXTRACT(YEAR FROM CURRENT_DATE)
            LEFT JOIN repairstatus s ON r.StatusId = s.RepairStatusId
            GROUP BY m.month, m.month_name
            ORDER BY m.month;
            `);
    const repairs = result.rows.map((row: any) => ({
      month: row.month,
      completed: Number(row.completed),
      repairs: Number(row.repairs),
    }));
    res.status(200).json(repairs);
  } catch (error: any) {
    console.error("Failed to get monthly repairs", error);
    res.status(500).json({ message: "Failed to fetch monthly repairs data" });
  }
};

export const monthlyRequests = async (req: Request, res: Response) => {
  try {
    const result = await db.query(`
                                WITH months AS (
                SELECT 1 AS month, 'Jan' AS month_name UNION ALL 
                SELECT 2, 'Feb' UNION ALL SELECT 3, 'Mar' UNION ALL 
                SELECT 4, 'Apr' UNION ALL SELECT 5, 'May' UNION ALL 
                SELECT 6, 'Jun' UNION ALL SELECT 7, 'Jul' UNION ALL 
                SELECT 8, 'Aug' UNION ALL SELECT 9, 'Sep' UNION ALL 
                SELECT 10, 'Oct' UNION ALL SELECT 11, 'Nov' UNION ALL 
                SELECT 12, 'Dec'
            )
                SELECT m.month_name AS month,
                SUM(CASE WHEN s.RequestStatusName IN ('recieved') THEN 1 ELSE 0 END) AS completed,
                COALESCE(COUNT(r.RequestId), 0) AS requests
                FROM months m
                LEFT JOIN request r ON m.month = EXTRACT(MONTH FROM r.RequestDate) AND EXTRACT(YEAR FROM r.RequestDate) = EXTRACT(YEAR FROM CURRENT_DATE)
                LEFT JOIN requeststatus s ON r.StatusId = s.RequestStatusId
                GROUP BY m.month,m.month_name
                ORDER BY m.month;    
            `);
    const requests = result.rows.map((row: any) => ({
      month: row.month,
      completed: Number(row.completed),
      requests: Number(row.requests),
    }));
    res.status(200).json(requests);
  } catch (error: any) {
    console.error("Failed to get monthly requests data", error);
    res.status(500).json({ message: "Failed to fetch monthly request data" });
  }
};
