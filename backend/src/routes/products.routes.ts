import { Router } from 'express';
import multer from 'multer';
import { importProducts, getProducts, getProductById, updateProduct, deleteProduct } from '../controllers/products.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/import', upload.single('file'), importProducts);
router.get('/', getProducts);
router.get('/:id', getProductById);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

export default router;
