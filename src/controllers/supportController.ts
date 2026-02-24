import { Request, Response } from 'express';
import db from '../config/db';

export const createSupport = async (req: Request, res: Response)=>{
    const {
        CallerName,
        DepartmentName,
        RecieverName,
        Reason,
        Status = 'Pending'
    } = req.body;

    if (!DepartmentName || !RecieverName || !Reason){
        return res.status(400).json({ message:"Missing required fields" });
    }

    try{
        const departmentCheck = await db.query(`
                SELECT departmentid FROM department
                WHERE departmentname = $1;  
            `, [DepartmentName]);
        if (departmentCheck.rows.length === 0){
            return res.status(400).json({ message:"Department Doesn't Exist" })
        }
        const departmentId = departmentCheck.rows[0].departmentid;

        const statusCheck = await db.query(`
                SELECT supportstatusid FROM supportstatus
                WHERE supportstatusname = $1;  
            `, [Status])
            if (statusCheck.rows.length === 0){
                return res.status(400).json({ message:"Status Doesn't Exist" })
            }
        const statusId = statusCheck.rows[0].supportstatusid;

        const result = await db.query(`
                INSERT INTO support (callername, departmentid, recievedby, reason, statusid)
                VALUES ($1, $2, $3, $4, $5)  
                RETURNING supportid AS "SupportId";
            `, [CallerName, departmentId, RecieverName, Reason, statusId]);
        
            const supportId = result.rows[0].SupportId;

            res.status(201).json({
                message:"Successfully Created Support Request",
                supportId
            })
    } catch (error: any){
      console.error('Failed to create support request', error);
      res.status(500).json({ message:"Failed to create support record" });
  }
}

export const getSupport = async (req: Request, res: Response)=>{
    try{
        const result = await db.query(`
                 SELECT 
	s.supportid AS "SupportId",
	s.callername AS "CallerName",
	d.departmentname AS "DepartmentName",
	s.recievedby AS "RecieverName",
	s.reason AS "Reason",
	st.supportstatusname AS "StatusName",
	s.createdat AS "CreatedAt"
FROM support s
	LEFT JOIN department d ON s.departmentid = d.departmentid
	LEFT JOIN supportstatus st ON s.supportid = st.supportstatusid
	ORDER BY
	s.supportid DESC;
            `);

    const supports = result.rows.map((row: any)=>({
        SupportId: `SUP${String(row.SupportId).padStart(3, '0')}`,
        CallerName: row.CallerName,
        Department: row.DepartmentName,
        RecieverName: row.RecieverName,
        Reason: row.Reason,
        Status: row.StatusName,
        CreatedAt: row.CreatedAt
    }))

    res.status(200).json(supports);
    } catch (error: any){
          console.error('Failed to retreive support requests', error);
          res.status(500).json({ message:"Failed to get support requests" });
      }
}