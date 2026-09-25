import { Router } from 'express';
import { getBuilderOptionsController, getPizza, listPizzas } from '../controllers/product.controller.js';

const router = Router();

router.get('/pizzas', listPizzas);
router.get('/pizzas/:id', getPizza);
router.get('/builder/options', getBuilderOptionsController);

export default router;
