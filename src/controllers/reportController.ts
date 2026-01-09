import { Request, Response } from "express";
import sql from "../config/db";

export const reportTable_Repair = async (req: Request, res: Response) => {
  try {
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
            `);
    const repairs = result.recordset.map((row) => ({
      category: row.category,
      total: row.total,
      completed: row.completed,
      pending: row.pending,
      completionpercent: ((row.completed / row.total) * 100).toFixed(0) + "%",
    }));
    res.status(200).json(repairs);
  } catch (error: any) {
    console.error("Failed to fetch repair report table", error);
    res.status(500).json({ message: "Failed to load report table for repair" });
  }
};

export const reportTable_Request = async (req: Request, res: Response) => {
  try {
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
    const requests = result.recordset.map((row) => ({
      catgory: row.category,
      total: row.total,
      completed: row.completed,
      pending: row.pending,
      completionpercent: ((row.completed / row.total) * 100).toFixed(0) + "%",
    }));

    res.status(200).json(requests);
  } catch (error: any) {
    console.error("Failed to get request report table", error);
    res.status(500).json({ message: "Failed to get report table for requets" });
  }
};

export const repairSummary = async (req: Request, res: Response) => {
  try {
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
            `);
    const row = result.recordset[0];
    const thisMonth = row.this_month_repairs;
    const lastMonth = row.last_month_repairs;
    let percentChange = 0;
    if (lastMonth > 0) {
      percentChange = ((thisMonth - lastMonth) / lastMonth) * 100;
    }

    const stats = {
      totalrepairs: row.totalrepairs,
      repairtime: row.repairtime.toFixed(2),
      completed: row.completed,
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
    const request = new sql.Request();
    const result = await request.query(`
                SELECT 
            COUNT(RequestId) AS totalrequests,
            SUM(CASE WHEN MONTH(RequestDate) = MONTH(GETDATE())
                AND YEAR(RequestDate) = YEAR(GETDATE()) THEN 1 ELSE 0 END) AS this_month_request,

            SUM(CASE WHEN MONTH(RequestDate) = MONTH(DATEADD(MONTH, -1, GETDATE())) AND
                YEAR(RequestDate) = YEAR(DATEADD(MONTH, -1, GETDATE())) THEN 1 ELSE 0 END) AS last_month_request
                
                FROM request;
            `);
    const row = result.recordset[0];
    const thisMonth = row.this_month_request;
    const lastMonth = row.last_month_request;

    let percentChange = 0;

    if (lastMonth > 0) {
      percentChange = ((thisMonth - lastMonth) / lastMonth) * 100;
    }
    const stats = {
      totalrequests: row.totalrequests,
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
    const request = new sql.Request();
    const result = await request.query(`
                SELECT 
                dc.DeviceCatName AS category,
                COUNT(dc.DeviceCatName) AS count
                FROM device d
                JOIN devicecat dc ON d.Category = dc.DeviceCatId
                GROUP BY dc.DeviceCatName;
            `);
    const categories = result.recordset.map((row) => ({
      category: row.category,
      count: row.count,
    }));

    res.status(200).json(categories);
  } catch (error: any) {
    console.error("Failed to get catgory count", error);
    res.status(500).json({ message: "Failed to fetch category count" });
  }
};

export const requestMetric = async (req: Request, res: Response) => {
  try {
    const request = new sql.Request();
    const result = await request.query(`
                SELECT
                SUM(CASE WHEN s.RequestStatusName = 'Recieved' THEN 1 ELSE 0 END) AS recieved,
                SUM(CASE WHEN s.RequestStatusName NOT IN ('Recieved', 'Cancelled') THEN 1 ELSE 0 END) AS pending
                FROM request r
                JOIN requeststatus s ON r.StatusId = s.RequestStatusId;
            `);
    const requests = result.recordset.map((row) => ({
      recieved: row.recieved,
      pending: row.pending,
    }));

    res.status(200).json(requests);
  } catch (error: any) {
    console.error("Failed to get request metric", error);
    res.status(500).json({ message: "Failed to fetch request metric" });
  }
};

export const repairMetric = async (req: Request, res: Response) => {
  try {
    const request = new sql.Request();
    const result = await request.query(`
                    SELECT
            SUM(CASE WHEN s.RepairStatusName NOT IN ('Recieved','Repaired','Cancelled') THEN 1 ELSE 0 END) AS underrepair,
            SUM(CASE WHEN MONTH(r.IssueDate)=MONTH(GETDATE())
                AND YEAR(r.IssueDate)=YEAR(GETDATE()) THEN r.cost ELSE 0 END ) AS cost
            FROM repair r
            JOIN repairstatus s ON r.StatusId = s.RepairStatusId;  
        `);
    const repairs = result.recordset[0];
    res.status(200).json(repairs);
  } catch (error: any) {
    console.error("Failed to get repair metric", error);
    res.status(500).json({ message: "Failed to fetch repair metric" });
  }
};

export const departmentRequest = async (req: Request, res: Response) => {
  try {
    const request = new sql.Request();
    const result = await request.query(`
                SELECT 
                d.DepartmentName AS department,
                COUNT(d.DepartmentName) AS count
                FROM request r
                JOIN users u ON r.UserId = u.UserId
                JOIN department d ON u.DepartmentId = d.DepartmentId
                GROUP BY d.DepartmentName;
            `);
    const counts = result.recordset.map((row) => ({
      department: row.department,
      count: row.count,
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
    const request = new sql.Request();
    const result = await request.query(`
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
            LEFT JOIN repair r ON m.month = MONTH(r.IssueDate) 
                AND YEAR(r.IssueDate) = YEAR(GETDATE())
            LEFT JOIN repairstatus s ON r.StatusId = s.RepairStatusId
            GROUP BY m.month, m.month_name
            ORDER BY m.month;
            `);
    const repairs = result.recordset.map((row) => ({
      month: row.month,
      completed: row.completed,
      repairs: row.repairs,
    }));
    res.status(200).json(repairs);
  } catch (error: any) {
    console.error("Failed to get monthly repairs", error);
    res.status(500).json({ message: "Failed to fetch monthly repairs data" });
  }
};

export const monthlyRequests = async (req: Request, res: Response) => {
  try {
    const request = new sql.Request();
    const result = await request.query(`
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
                LEFT JOIN request r ON m.month = MONTH(r.RequestDate) AND YEAR(r.RequestDate) = YEAR(GETDATE())
                LEFT JOIN requeststatus s ON r.StatusId = s.RequestStatusId
                GROUP BY m.month,m.month_name
                ORDER BY m.month;    
            `);
    const requests = result.recordset.map((row) => ({
      month: row.month,
      completed: row.completed,
      requests: row.requests,
    }));
    res.status(200).json(requests);
  } catch (error: any) {
    console.error("Failed to get monthly requests data", error);
    res.status(500).json({ message: "Failed to fetch monthly request data" });
  }
};
