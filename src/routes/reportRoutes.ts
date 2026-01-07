import { Router } from "express";
import { 
    reportTable_Repair, reportTable_Request, repairSummary, requestSummary, deviceCategoryChart, requestMetric, repairMetric
} from "../controllers/reportController";

const router = Router();

router.get('/reporttablerepair', reportTable_Repair);
router.get('/reporttablerequest', reportTable_Request);
router.get('/repairsummary', repairSummary);
router.get('/requestsummary', requestSummary);
router.get('/devicecategorychart', deviceCategoryChart);
router.get('/requestmetric', requestMetric);
router.get('/repairmetric', repairMetric);

export default router;