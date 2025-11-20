import { pgTable, text, timestamp, decimal, varchar, boolean } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const restaurants = pgTable("restaurants", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    location: text("location"),
    phone: text("phone"),
    email: text("email"),
    logo: text("logo"),
    coverImage: text("cover_image"),
    isActive: boolean("is_active").notNull().default(true),
    ownerId: text("owner_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at")
        .$defaultFn(() => new Date())
        .notNull(),
    updatedAt: timestamp("updated_at")
        .$defaultFn(() => new Date())
        .notNull(),
});

export const menuCategories = pgTable("menu_categories", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    displayOrder: decimal("display_order", { precision: 10, scale: 2 }).notNull().default("0"),
    restaurantId: text("restaurant_id")
        .notNull()
        .references(() => restaurants.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at")
        .$defaultFn(() => new Date())
        .notNull(),
    updatedAt: timestamp("updated_at")
        .$defaultFn(() => new Date())
        .notNull(),
});

export const menuItems = pgTable("menu_items", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    image: text("image"),
    isAvailable: boolean("is_available").notNull().default(true),
    displayOrder: decimal("display_order", { precision: 10, scale: 2 }).notNull().default("0"),
    category: text("category"), // For allergens, dietary info, etc.
    ingredients: text("ingredients"), // Comma-separated list of ingredients
    preparationTime: text("preparation_time"), // e.g., "15-20 min"
    categoryId: text("category_id")
        .notNull()
        .references(() => menuCategories.id, { onDelete: "cascade" }),
    restaurantId: text("restaurant_id")
        .notNull()
        .references(() => restaurants.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at")
        .$defaultFn(() => new Date())
        .notNull(),
    updatedAt: timestamp("updated_at")
        .$defaultFn(() => new Date())
        .notNull(),
});

export const orderStatus = pgTable("order_status", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    displayOrder: decimal("display_order", { precision: 10, scale: 2 }).notNull().default("0"),
    createdAt: timestamp("created_at")
        .$defaultFn(() => new Date())
        .notNull(),
});

export const orders = pgTable("orders", {
    id: text("id").primaryKey(),
    orderNumber: varchar("order_number", { length: 50 }).notNull().unique(),
    totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
    status: text("status").notNull().default("PENDING"),
    customerName: text("customer_name"),
    customerEmail: text("customer_email"),
    customerPhone: text("customer_phone"),
    notes: text("notes"),
    estimatedDeliveryTime: timestamp("estimated_delivery_time"),
    actualDeliveryTime: timestamp("actual_delivery_time"),
    restaurantId: text("restaurant_id")
        .notNull()
        .references(() => restaurants.id, { onDelete: "cascade" }),
    customerId: text("customer_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at")
        .$defaultFn(() => new Date())
        .notNull(),
    updatedAt: timestamp("updated_at")
        .$defaultFn(() => new Date())
        .notNull(),
});

export const orderItems = pgTable("order_items", {
    id: text("id").primaryKey(),
    quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
    unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
    totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
    specialInstructions: text("special_instructions"),
    orderId: text("order_id")
        .notNull()
        .references(() => orders.id, { onDelete: "cascade" }),
    menuItemId: text("menu_item_id")
        .notNull()
        .references(() => menuItems.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at")
        .$defaultFn(() => new Date())
        .notNull(),
    updatedAt: timestamp("updated_at")
        .$defaultFn(() => new Date())
        .notNull(),
});

// Type exports for TypeScript usage
export type Restaurant = typeof restaurants.$inferSelect;
export type NewRestaurant = typeof restaurants.$inferInsert;
export type MenuCategory = typeof menuCategories.$inferSelect;
export type NewMenuCategory = typeof menuCategories.$inferInsert;
export type MenuItem = typeof menuItems.$inferSelect;
export type NewMenuItem = typeof menuItems.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;