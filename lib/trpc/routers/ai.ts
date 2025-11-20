import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../init';
import { restaurants, menuCategories, menuItems } from '../../../db';
import { eq } from 'drizzle-orm';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const aiRouter = router({
  chat: protectedProcedure
    .input(z.object({
      restaurantId: z.string(),
      message: z.string().min(1, 'Message cannot be empty'),
      conversationHistory: z.array(z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      })).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Get restaurant and menu information
      const restaurant = await ctx.db.query.restaurants.findFirst({
        where: eq(restaurants.id, input.restaurantId),
        with: {
          menuCategories: {
            with: {
              menuItems: {
                where: eq(menuItems.isAvailable, true),
              },
            },
          },
        },
      });

      if (!restaurant) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Restaurant not found',
        });
      }

      if (!restaurant.isActive) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'This restaurant is currently not available',
        });
      }

      // Format menu information for the AI
      const menuInfo = restaurant.menuCategories
        .map(category => {
          const items = category.menuItems
            .map(item => `• ${item.name}: $${item.price}${item.description ? ` - ${item.description}` : ''}${item.ingredients ? ` (Ingredients: ${item.ingredients})` : ''}${item.preparationTime ? ` (${item.preparationTime})` : ''}`)
            .join('\n');
          return `${category.name}:\n${items}`;
        })
        .join('\n\n');

      // Create the system prompt
      const systemPrompt = `You are a friendly and helpful virtual waitress for ${restaurant.name}.

Restaurant Information:
- Name: ${restaurant.name}
- Description: ${restaurant.description || 'A wonderful dining establishment'}
- Location: ${restaurant.location || 'Visit us for a great meal!'}

Available Menu:
${menuInfo}

Your role is to:
1. Help customers with menu questions and recommendations
2. Provide information about ingredients, preparation times, and pricing
3. Be friendly, welcoming, and professional
4. Suggest popular items or combinations
5. Answer questions about dietary restrictions and allergens based on the ingredients listed
6. Explain menu items in detail when asked

Important Guidelines:
- You CANNOT take orders or process payments. Direct customers to use the ordering system for placing orders.
- You can only discuss items that are currently available on the menu.
- Be honest about ingredients - if allergen information is not specified, let customers know they should ask the restaurant staff.
- Keep responses conversational and helpful, not overly formal.
- If you don't know something, be honest and suggest the customer ask restaurant staff.
- Do not make up information about prices, ingredients, or preparation methods that aren't listed.
- Focus on helping customers have a great dining experience.

Current conversation context:
${input.conversationHistory?.map(msg => `${msg.role}: ${msg.content}`).join('\n') || ''}

Customer's message: ${input.message}`;

      try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
        const result = await model.generateContent(systemPrompt);
        const response = result.response;
        const text = response.text();

        return {
          response: text,
          restaurantName: restaurant.name,
        };
      } catch (error) {
        console.error('Gemini API error:', error);

        // Fallback response if AI is unavailable
        return {
          response: `I'm sorry, I'm having trouble connecting right now. I'm here to help you with questions about ${restaurant.name}'s menu. Feel free to ask me about any menu items, ingredients, or I can help you make recommendations! For placing orders, please use the ordering system.`,
          restaurantName: restaurant.name,
          isFallback: true,
        };
      }
    }),

  getMenuSummary: protectedProcedure
    .input(z.object({ restaurantId: z.string() }))
    .query(async ({ ctx, input }) => {
      const restaurant = await ctx.db.query.restaurants.findFirst({
        where: eq(restaurants.id, input.restaurantId),
        with: {
          menuCategories: {
            with: {
              menuItems: {
                where: eq(menuItems.isAvailable, true),
              },
            },
          },
        },
      });

      if (!restaurant) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Restaurant not found',
        });
      }

      if (!restaurant.isActive) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'This restaurant is currently not available',
        });
      }

      // Create a summary of the menu
      const summary = {
        restaurantName: restaurant.name,
        restaurantDescription: restaurant.description,
        categories: restaurant.menuCategories.map(category => ({
          name: category.name,
          description: category.description,
          itemCount: category.menuItems.length,
          priceRange: {
            min: Math.min(...category.menuItems.map(item => Number(item.price))),
            max: Math.max(...category.menuItems.map(item => Number(item.price))),
          },
        })),
        totalItems: restaurant.menuCategories.reduce((total, cat) => total + cat.menuItems.length, 0),
      };

      return summary;
    }),

  getRecommendations: protectedProcedure
    .input(z.object({
      restaurantId: z.string(),
      preferences: z.object({
        dietaryRestrictions: z.array(z.string()).optional(),
        priceRange: z.object({
          min: z.number().optional(),
          max: z.number().optional(),
        }).optional(),
        category: z.string().optional(),
      }).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const restaurant = await ctx.db.query.restaurants.findFirst({
        where: eq(restaurants.id, input.restaurantId),
        with: {
          menuCategories: {
            with: {
              menuItems: {
                where: eq(menuItems.isAvailable, true),
              },
            },
          },
        },
      });

      if (!restaurant) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Restaurant not found',
        });
      }

      if (!restaurant.isActive) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'This restaurant is currently not available',
        });
      }

      // Filter items based on preferences
      let availableItems = restaurant.menuCategories.flatMap(category =>
        category.menuItems.map(item => ({
          ...item,
          categoryName: category.name,
        }))
      );

      // Apply filters
      if (input.preferences) {
        if (input.preferences.priceRange) {
          const { min, max } = input.preferences.priceRange;
          availableItems = availableItems.filter(item => {
            const price = Number(item.price);
            return (min ? price >= min : true) && (max ? price <= max : true);
          });
        }

        if (input.preferences.category) {
          availableItems = availableItems.filter(item =>
            item.categoryName.toLowerCase().includes(input.preferences!.category!.toLowerCase())
          );
        }

        if (input.preferences.dietaryRestrictions) {
          // This is a simple filter based on ingredients and description
          availableItems = availableItems.filter(item => {
            const itemText = `${item.name} ${item.description || ''} ${item.ingredients || ''}`.toLowerCase();
            return !input.preferences!.dietaryRestrictions!.some(restriction =>
              itemText.includes(restriction.toLowerCase())
            );
          });
        }
      }

      // Get recommendations using AI
      const menuText = availableItems
        .map(item => `• ${item.name} (${item.categoryName}): $${item.price}${item.description ? ` - ${item.description}` : ''}`)
        .join('\n');

      const prompt = `Based on the following available menu items from ${restaurant.name}, please provide 3-5 personalized recommendations. Consider the customer preferences if provided.

Available Menu:
${menuText}

Customer Preferences:
${input.preferences ? JSON.stringify(input.preferences, null, 2) : 'No specific preferences provided'}

Please provide recommendations in a friendly, helpful manner, explaining why each item would be a good choice.`;

      try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
        const result = await model.generateContent(prompt);
        const response = result.response;

        return {
          recommendations: response.text(),
          availableItemCount: availableItems.length,
        };
      } catch (error) {
        console.error('Gemini API error:', error);

        // Fallback: return popular items (highest priced or first few)
        const fallbackItems = availableItems
          .sort((a, b) => Number(b.price) - Number(a.price))
          .slice(0, 5);

        return {
          recommendations: `Here are some popular items from ${restaurant.name}:\n\n${fallbackItems.map(item => `• ${item.name}: $${item.price} - ${item.description || 'A delicious choice from our ${item.categoryName} menu'}`).join('\n\n')}`,
          availableItemCount: availableItems.length,
          isFallback: true,
        };
      }
    }),
});