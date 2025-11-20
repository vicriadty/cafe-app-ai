import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure, ownerProcedure } from '../init';
import { menuCategories, menuItems, restaurants } from '../../../db';
import { eq, and, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export const menuRouter = router({
  // Menu Categories
  createCategory: ownerProcedure
    .input(z.object({
      name: z.string().min(1, 'Category name is required'),
      description: z.string().optional(),
      displayOrder: z.number().default(0),
      restaurantId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
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
          message: 'You can only add categories to your own restaurants',
        });
      }

      const newCategory = {
        id: nanoid(),
        ...input,
      };

      const [created] = await ctx.db
        .insert(menuCategories)
        .values(newCategory)
        .returning();

      return created;
    }),

  updateCategory: ownerProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1, 'Category name is required'),
      description: z.string().optional(),
      displayOrder: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      // First check if category exists and user owns the restaurant
      const existingCategory = await ctx.db.query.menuCategories.findFirst({
        where: eq(menuCategories.id, input.id),
        with: {
          restaurant: true,
        },
      });

      if (!existingCategory) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Category not found',
        });
      }

      if (existingCategory.restaurant.ownerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only update categories in your own restaurants',
        });
      }

      const { id, ...updateData } = input;

      const [updated] = await ctx.db
        .update(menuCategories)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(menuCategories.id, id))
        .returning();

      return updated;
    }),

  deleteCategory: ownerProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // First check if category exists and user owns the restaurant
      const existingCategory = await ctx.db.query.menuCategories.findFirst({
        where: eq(menuCategories.id, input.id),
        with: {
          restaurant: true,
        },
      });

      if (!existingCategory) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Category not found',
        });
      }

      if (existingCategory.restaurant.ownerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only delete categories in your own restaurants',
        });
      }

      await ctx.db.delete(menuCategories).where(eq(menuCategories.id, input.id));

      return { success: true, message: 'Category deleted successfully' };
    }),

  // Menu Items
  createItem: ownerProcedure
    .input(z.object({
      name: z.string().min(1, 'Item name is required'),
      description: z.string().optional(),
      price: z.number().min(0, 'Price must be non-negative'),
      image: z.string().url().optional(),
      isAvailable: z.boolean().default(true),
      displayOrder: z.number().default(0),
      category: z.string().optional(),
      ingredients: z.string().optional(),
      preparationTime: z.string().optional(),
      categoryId: z.string(),
      restaurantId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
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
          message: 'You can only add items to your own restaurants',
        });
      }

      // Verify category belongs to the restaurant
      const category = await ctx.db.query.menuCategories.findFirst({
        where: eq(menuCategories.id, input.categoryId),
      });

      if (!category || category.restaurantId !== input.restaurantId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid category for this restaurant',
        });
      }

      const newItem = {
        id: nanoid(),
        ...input,
      };

      const [created] = await ctx.db
        .insert(menuItems)
        .values(newItem)
        .returning();

      return created;
    }),

  updateItem: ownerProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1, 'Item name is required'),
      description: z.string().optional(),
      price: z.number().min(0, 'Price must be non-negative'),
      image: z.string().url().optional(),
      isAvailable: z.boolean(),
      displayOrder: z.number(),
      category: z.string().optional(),
      ingredients: z.string().optional(),
      preparationTime: z.string().optional(),
      categoryId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // First check if item exists and user owns the restaurant
      const existingItem = await ctx.db.query.menuItems.findFirst({
        where: eq(menuItems.id, input.id),
        with: {
          restaurant: true,
        },
      });

      if (!existingItem) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Menu item not found',
        });
      }

      if (existingItem.restaurant.ownerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only update items in your own restaurants',
        });
      }

      // Verify category belongs to the same restaurant
      const category = await ctx.db.query.menuCategories.findFirst({
        where: eq(menuCategories.id, input.categoryId),
      });

      if (!category || category.restaurantId !== existingItem.restaurantId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid category for this restaurant',
        });
      }

      const { id, ...updateData } = input;

      const [updated] = await ctx.db
        .update(menuItems)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(menuItems.id, id))
        .returning();

      return updated;
    }),

  deleteItem: ownerProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // First check if item exists and user owns the restaurant
      const existingItem = await ctx.db.query.menuItems.findFirst({
        where: eq(menuItems.id, input.id),
        with: {
          restaurant: true,
        },
      });

      if (!existingItem) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Menu item not found',
        });
      }

      if (existingItem.restaurant.ownerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only delete items in your own restaurants',
        });
      }

      await ctx.db.delete(menuItems).where(eq(menuItems.id, input.id));

      return { success: true, message: 'Menu item deleted successfully' };
    }),

  // Toggle item availability (quick action for owners)
  toggleItemAvailability: ownerProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // First check if item exists and user owns the restaurant
      const existingItem = await ctx.db.query.menuItems.findFirst({
        where: eq(menuItems.id, input.id),
        with: {
          restaurant: true,
        },
      });

      if (!existingItem) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Menu item not found',
        });
      }

      if (existingItem.restaurant.ownerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only modify items in your own restaurants',
        });
      }

      const [updated] = await ctx.db
        .update(menuItems)
        .set({
          isAvailable: !existingItem.isAvailable,
          updatedAt: new Date(),
        })
        .where(eq(menuItems.id, input.id))
        .returning();

      return updated;
    }),

  // Get menu items for a restaurant (public endpoint)
  getByRestaurant: protectedProcedure
    .input(z.object({
      restaurantId: z.string(),
      includeUnavailable: z.boolean().default(false),
    }))
    .query(async ({ ctx, input }) => {
      const restaurant = await ctx.db.query.restaurants.findFirst({
        where: eq(restaurants.id, input.restaurantId),
        with: {
          menuCategories: {
            with: {
              menuItems: (itemQuery) => {
                if (!input.includeUnavailable) {
                  return itemQuery.where(eq(menuItems.isAvailable, true));
                }
                return itemQuery;
              },
            },
            orderBy: menuCategories.displayOrder,
          },
        },
      });

      if (!restaurant) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Restaurant not found',
        });
      }

      // Return categories with their items
      return restaurant.menuCategories.map(category => ({
        ...category,
        menuItems: category.menuItems.sort((a, b) =>
          Number(a.displayOrder) - Number(b.displayOrder)
        ),
      }));
    }),
});