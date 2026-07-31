import { Router } from 'express';
import * as ordersController from '../controllers/orders.controller';

const router = Router();

router.post('/', ordersController.createOrder);
router.get('/', ordersController.getOrders);
router.get('/:id', ordersController.getOrderById);
router.delete('/:id', ordersController.deleteOrder);

export default router;
