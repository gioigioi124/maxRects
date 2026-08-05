import { Router } from 'express';
import * as printController from '../controllers/print.controller';

const router = Router();

router.get('/order/:id', printController.printOrder);
router.get('/part/:partId', printController.printPart);
router.get('/product/:productId/all-parts', printController.printAllParts);
router.get('/batch/:batchId/report', printController.printBatchReport);

export default router;