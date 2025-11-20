import { createTRPCRouter } from './init';
import { restaurantRouter } from './routers/restaurant';
import { menuRouter } from './routers/menu';
import { orderRouter } from './routers/order';
import { aiRouter } from './routers/ai';

export const appRouter = createTRPCRouter({
  restaurant: restaurantRouter,
  menu: menuRouter,
  order: orderRouter,
  ai: aiRouter,
});

export type AppRouter = typeof appRouter;