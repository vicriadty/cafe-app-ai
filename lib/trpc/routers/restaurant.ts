import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure, protectedProcedure, ownerProcedure } from '../init';
import { restaurants, menuCategories, menuItems } from '../../../db';
import { eq, and, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export const restaurantRouter = router({
  // Public procedures
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const restaurant = await ctx.db.query.restaurants.findFirst({
        where: eq(restaurants.slug, input.slug),
        with: {
          menuCategories: {
            with: {
              menuItems: {
                where: eq(menuItems.isAvailable, true),
                orderBy: menuItems.displayOrder,
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

      return restaurant;
    }),

  getAllPublic: publicProcedure
    .query(async ({ ctx }) => {
      return await ctx.db.query.restaurants.findMany({
        where: eq(restaurants.isActive, true),
        columns: {
          id: true,
          name: true,
          description: true,
          slug: true,
          location: true,
          logo: true,
          coverImage: true,
        },
        orderBy: desc(restaurants.createdAt),
      });
    }),

  // Protected procedures for authenticated users
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const restaurant = await ctx.db.query.restaurants.findFirst({
        where: eq(restaurants.id, input.id),
        with: {
          menuCategories: {
            with: {
              menuItems: {
                orderBy: menuItems.displayOrder,
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

      // Check if user is the owner or make it read-only for others
      if (restaurant.ownerId !== ctx.session.user.id) {
        // Return limited data for non-owners
        return {
          id: restaurant.id,
          name: restaurant.name,
          description: restaurant.description,
          slug: restaurant.slug,
          location: restaurant.location,
          logo: restaurant.logo,
          coverImage: restaurant.coverImage,
          isActive: restaurant.isActive,
          menuCategories: restaurant.menuCategories.map(category => ({
            id: category.id,
            name: category.name,
            description: category.description,
            displayOrder: category.displayOrder,
            menuItems: category.menuItems.filter(item => item.isAvailable).map(item => ({
              id: item.id,
              name: item.name,
              description: item.description,
              price: item.price,
              image: item.image,
              displayOrder: item.displayOrder,
            })),
          })),
        };
      }

      return restaurant;
    }),

  // Owner-only procedures
  create: ownerProcedure
    .input(z.object({
      name: z.string().min(1, 'Restaurant name is required'),
      description: z.string().optional(),
      slug: z.string().min(1, 'Slug is required'),
      location: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().email().optional(),
      logo: z.string().url().optional(),
      coverImage: z.string().url().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if slug already exists
      const existingRestaurant = await ctx.db.query.restaurants.findFirst({
        where: eq(restaurants.slug, input.slug),
      });

      if (existingRestaurant) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'A restaurant with this slug already exists',
        });
      }

      const newRestaurant = {
        id: nanoid(),
        ...input,
        ownerId: ctx.session.user.id,
        isActive: true,
      };

      const [created] = await ctx.db
        .insert(restaurants)
        .values(newRestaurant)
        .returning();

      return created;
    }),

  update: ownerProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1, 'Restaurant name is required'),
      description: z.string().optional(),
      slug: z.string().min(1, 'Slug is required'),
      location: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().email().optional(),
      logo: z.string().url().optional(),
      coverImage: z.string().url().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // First check if restaurant exists and user owns it
      const existingRestaurant = await ctx.db.query.restaurants.findFirst({
        where: eq(restaurants.id, input.id),
      });

      if (!existingRestaurant) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Restaurant not found',
        });
      }

      if (existingRestaurant.ownerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only update your own restaurants',
        });
      }

      // Check if slug conflicts with another restaurant
      if (input.slug !== existingRestaurant.slug) {
        const slugConflict = await ctx.db.query.restaurants.findFirst({
          where: and(
            eq(restaurants.slug, input.slug),
            // @ts-ignore
            restaurants.id !== input.id
          ),
        });

        if (slugConflict) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'A restaurant with this slug already exists',
          });
        }
      }

      const { id, ...updateData } = input;

      const [updated] = await ctx.db
        .update(restaurants)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(restaurants.id, id))
        .returning();

      return updated;
    }),

  delete: ownerProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // First check if restaurant exists and user owns it
      const existingRestaurant = await ctx.db.query.restaurants.findFirst({
        where: eq(restaurants.id, input.id),
      });

      if (!existingRestaurant) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Restaurant not found',
        });
      }

      if (existingRestaurant.ownerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only delete your own restaurants',
        });
      }

      await ctx.db.delete(restaurants).where(eq(restaurants.id, input.id));

      return { success: true, message: 'Restaurant deleted successfully' };
    }),

  getMyRestaurants: ownerProcedure
    .query(async ({ ctx }) => {
      return await ctx.db.query.restaurants.findMany({
        where: eq(restaurants.ownerId, ctx.session.user.id),
        with: {
          menuCategories: {
            with: {
              menuItems: true,
            },
          },
        },
        orderBy: desc(restaurants.createdAt),
      });
    }),
});