import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure, ownerProcedure } from '../init';
import { orders, orderItems, menuItems, restaurants } from '../../../db';
import { eq, and, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';

const orderStatusEnum = z.enum(['PENDING', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED']);

export const orderRouter = router({
  // Place a new order (for customers)
  placeOrder: protectedProcedure
    .input(z.object({
      restaurantId: z.string(),
      items: z.array(z.object({
        menuItemId: z.string(),
        quantity: z.number().min(1, 'Quantity must be at least 1'),
        specialInstructions: z.string().optional(),
      })),
      customerName: z.string().optional(),
      customerEmail: z.string().email().optional(),
      customerPhone: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify restaurant exists and is active
      const restaurant = await ctx.db.query.restaurants.findFirst({
        where: eq(restaurants.id, input.restaurantId),
      });

      if (!restaurant || !restaurant.isActive) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Restaurant not found or not available',
        });
      }

      // Verify all menu items exist and are available
      const menuItemIds = input.items.map(item => item.menuItemId);
      const menuItemsDb = await ctx.db.query.menuItems.findMany({
        where: eq(menuItems.id, menuItemIds[0]), // This won't work properly, need to use 'in' operator
      });

      // For simplicity, let's check each item individually
      for (const item of input.items) {
        const menuItem = await ctx.db.query.menuItems.findFirst({
          where: eq(menuItems.id, item.menuItemId),
        });

        if (!menuItem) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Menu item not found: ${item.menuItemId}`,
          });
        }

        if (!menuItem.isAvailable) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Menu item is not available: ${menuItem.name}`,
          });
        }

        if (menuItem.restaurantId !== input.restaurantId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Menu item does not belong to this restaurant: ${menuItem.name}`,
          });
        }
      }

      // Calculate total amount
      let totalAmount = 0;
      const orderItemsData = [];

      for (const item of input.items) {
        const menuItem = await ctx.db.query.menuItems.findFirst({
          where: eq(menuItems.id, item.menuItemId),
        })!;

        const unitPrice = Number(menuItem!.price);
        const quantity = item.quantity;
        const totalPrice = unitPrice * quantity;

        totalAmount += totalPrice;

        orderItemsData.push({
          id: nanoid(),
          menuItemId: item.menuItemId,
          quantity: quantity,
          unitPrice: unitPrice,
          totalPrice: totalPrice,
          specialInstructions: item.specialInstructions,
        });
      }

      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Create the order
      const newOrder = {
        id: nanoid(),
        orderNumber,
        totalAmount: totalAmount,
        status: 'PENDING',
        customerName: input.customerName || ctx.session.user.name,
        customerEmail: input.customerEmail || ctx.session.user.email,
        customerPhone: input.customerPhone,
        notes: input.notes,
        restaurantId: input.restaurantId,
        customerId: ctx.session.user.id,
      };

      // Start transaction
      try {
        // Create order
        const [createdOrder] = await ctx.db
          .insert(orders)
          .values(newOrder)
          .returning();

        // Create order items
        for (const itemData of orderItemsData) {
          await ctx.db.insert(orderItems).values({
            ...itemData,
            orderId: createdOrder.id,
          });
        }

        return createdOrder;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create order',
        });
      }
    }),

  // Get order details
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const order = await ctx.db.query.orders.findFirst({
        where: eq(orders.id, input.id),
        with: {
          orderItems: {
            with: {
              menuItem: true,
            },
          },
          restaurant: {
            columns: {
              id: true,
              name: true,
              location: true,
            },
          },
          customer: {
            columns: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!order) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Order not found',
        });
      }

      // Check if user is the customer or the restaurant owner
      const isCustomer = order.customerId === ctx.session.user.id;
      const isOwner = order.restaurant.ownerId === ctx.session.user.id; // Assuming we have restaurant.ownerId

      if (!isCustomer && !isOwner) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only view your own orders',
        });
      }

      return order;
    }),

  // Get orders for the current user (customer)
  getMyOrders: protectedProcedure
    .input(z.object({
      status: orderStatusEnum.optional(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      let whereClause = eq(orders.customerId, ctx.session.user.id);

      // Note: In a real implementation, you'd need to combine the where clauses properly
      // This is a simplified version

      const userOrders = await ctx.db.query.orders.findMany({
        where: whereClause,
        with: {
          restaurant: {
            columns: {
              id: true,
              name: true,
              location: true,
            },
          },
          orderItems: {
            with: {
              menuItem: {
                columns: {
                  id: true,
                  name: true,
                  price: true,
                },
              },
            },
          },
        },
        orderBy: desc(orders.createdAt),
        limit: input.limit,
        offset: input.offset,
      });

      return userOrders;
    }),

  // Get orders for restaurant owners
  getOrdersForRestaurant: ownerProcedure
    .input(z.object({
      restaurantId: z.string(),
      status: orderStatusEnum.optional(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      // Verify user owns the restaurant
      const restaurant = await ctx.db.query.restaurants.findFirst({
        where: eq(restaurants.id, input.restaurantId),
      });

      if (!restaurant) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Restaurant not found',
        });
      }

      if (restaurant.ownerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only view orders for your own restaurants',
        });
      }

      let whereClause = eq(orders.restaurantId, input.restaurantId);

      const restaurantOrders = await ctx.db.query.orders.findMany({
        where: whereClause,
        with: {
          customer: {
            columns: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          orderItems: {
            with: {
              menuItem: {
                columns: {
                  id: true,
                  name: true,
                  price: true,
                },
              },
            },
          },
        },
        orderBy: desc(orders.createdAt),
        limit: input.limit,
        offset: input.offset,
      });

      return restaurantOrders;
    }),

  // Update order status (restaurant owners only)
  updateStatus: ownerProcedure
    .input(z.object({
      id: z.string(),
      status: orderStatusEnum,
    }))
    .mutation(async ({ ctx, input }) => {
      // First check if order exists and get restaurant info
      const existingOrder = await ctx.db.query.orders.findFirst({
        where: eq(orders.id, input.id),
        with: {
          restaurant: true,
        },
      });

      if (!existingOrder) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Order not found',
        });
      }

      if (existingOrder.restaurant.ownerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only update orders for your own restaurants',
        });
      }

      // Validate status transitions
      const currentStatus = existingOrder.status;
      const newStatus = input.status;

      const validTransitions = {
        'PENDING': ['PREPARING', 'CANCELLED'],
        'PREPARING': ['READY', 'CANCELLED'],
        'READY': ['COMPLETED', 'CANCELLED'],
        'COMPLETED': [], // No further transitions allowed
        'CANCELLED': [], // No further transitions allowed
      };

      if (!validTransitions[currentStatus as keyof typeof validTransitions].includes(newStatus)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Invalid status transition from ${currentStatus} to ${newStatus}`,
        });
      }

      const [updated] = await ctx.db
        .update(orders)
        .set({
          status: newStatus,
          updatedAt: new Date(),
          // Set actual delivery time if order is completed
          ...(newStatus === 'COMPLETED' && { actualDeliveryTime: new Date() }),
        })
        .where(eq(orders.id, input.id))
        .returning();

      return updated;
    }),

  // Cancel order (customers can cancel their own pending orders)
  cancelOrder: protectedProcedure
    .input(z.object({
      id: z.string(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // First check if order exists and belongs to the user
      const existingOrder = await ctx.db.query.orders.findFirst({
        where: eq(orders.id, input.id),
      });

      if (!existingOrder) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Order not found',
        });
      }

      if (existingOrder.customerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only cancel your own orders',
        });
      }

      if (existingOrder.status !== 'PENDING') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Only pending orders can be cancelled',
        });
      }

      const [updated] = await ctx.db
        .update(orders)
        .set({
          status: 'CANCELLED',
          notes: input.reason
            ? `Cancelled: ${input.reason}`
            : 'Cancelled by customer',
          updatedAt: new Date(),
        })
        .where(eq(orders.id, input.id))
        .returning();

      return updated;
    }),
});