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
	LEFT JOIN supportstatus st ON s.statusid = st.supportstatusid
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

export const updateSupport = async (req: Request, res: Response)=>{
    const { id } = req.params;
    const SupportId = Number(id);

    if (isNaN(SupportId) || SupportId <= 0){
    return res.status(400).json({ message:"Invalid support id" });
  }

  const{
    CallerName,
    DepartmentName,
    RecieverName,
    Reason,
    StatusName,
    CreatedAt   
  } = req.body

  if (!CallerName && !DepartmentName && RecieverName && !Reason && !StatusName && !CreatedAt){
    return res.status(400).json({ message:"At least one field is required to update" });
  }

  if (CallerName && typeof CallerName !== 'string'){
    return res.status(400).json({ message:"Caller Name must be a string" });
  }
  if (DepartmentName && typeof DepartmentName !== 'string'){
    return res.status(400).json({ message:"Department Name must be a string" });
  }
  if (RecieverName && typeof RecieverName !== 'string'){
    return res.status(400).json({ message:"Reciever Name must be a string" });
  }
  if (Reason && typeof Reason !== 'string'){
    return res.status(400).json({ message:"Reason must be a string" });
  }
  if (StatusName && typeof StatusName !== 'string'){
    return res.status(400).json({ message:"Status Name must be a string" });
  }

  try{
    const updates: string[] = [];
    const checkStatus = await db.query(`
            SELECT supportstatusid FROM supportstatus
            WHERE supportstatusname = $1;
          `, [StatusName])
          if (checkStatus.rows.length === 0){
            return res.status(400).json({ message:"Status name not specified or doesn't exist" });
          }
          
          const StatusId = checkStatus.rows[0].supportstatusid;


          const checkDepartment = await db.query(`
            SELECT departmentid FROM department
            WHERE departmentname = $1;
          `, [DepartmentName])
          if (checkDepartment.rows.length === 0){
            return res.status(400).json({ message:"Department name not specified or doesn't exist" });
          }
          
          const DepartmentId = checkDepartment.rows[0].departmentid;
          const values: any[] = [];
          let index = 1;

    if (CallerName !== undefined){
      updates.push(`callername = $${index++}`)
      values.push(CallerName)
    }
    if (DepartmentId !== undefined){
      updates.push(`departmentid = $${index++}`)
      values.push(DepartmentId)
    }
    if (RecieverName !== undefined){
      updates.push(`recievedby = $${index++}`)
      values.push(RecieverName)
    }
    if (Reason !== undefined){
      updates.push(`reason = $${index++}`)
      values.push(Reason)
    }
    if (StatusId !== undefined){
      updates.push(`statusid = $${index++}`)
      values.push(StatusId)
    }
    if (CreatedAt !== undefined){
      updates.push(`createdat = $${index++}`)
      values.push(CreatedAt)
    }

    values.push(SupportId);
    const result = await db.query(`
            UPDATE support
            SET ${updates.join(', ')}
            WHERE supportid = $${index};  
        `, values);

        if (result.rowCount === 0){
        return res.status(404).json({ message:"Support record not found" })
      }

      res.status(200).json({ 
        message: "Successfully updated support request",
        SupportId,
       })
  } catch(error: any){
      console.error("Failed to update support request", error);
      res.status(500).json({ message:"Failed to update support record" });
    }
}

export const deleteSupport = async (req: Request, res: Response)=>{
    const { id } = req.params;
  const SupportId = Number(id);
  
  if (isNaN(SupportId) || SupportId <= 0){
    return res.status(400).json({ message:"Invalid repair id" });
  }

  try{
    const result = await db.query(`
            DELETE FROM support 
            WHERE supportid = $1; 
        `, [SupportId]);

    if (result.rowCount===0){
        return res.status(400).json({ message:"Could not find support id" });
    }

    res.status(200).json({ 
      message:"Successfully deleted the support request",
      SupportId,
     });
  } catch (error: any) {
      console.error('Failed to delete the support', error);
      res.status(500).json({ message:"Failed to remove support request" });
  }
}