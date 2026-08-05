import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import productsRoutes from './routes/products.routes';
import ordersRoutes from './routes/orders.routes';
import packingRoutes from './routes/packing.routes';
import printRoutes from './routes/print.routes';
import { errorHandler, notFoundHandler } from './middlewares/error-handler';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/products', productsRoutes);
app.use('/orders', ordersRoutes);
app.use('/packing', packingRoutes);
app.use('/print', printRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running!' });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
