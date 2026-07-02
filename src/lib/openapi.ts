/**
 * OpenAPI 3.0 description of the SEAPEDIA REST API.
 * Served as JSON at /api/openapi.json and rendered at /api-docs.
 * Hand-authored to stay dependency-free and match the route handlers.
 */

const bearerNote =
  "Authentication uses an httpOnly session cookie set on login/register. " +
  "In the browser it is sent automatically. All private endpoints also " +
  "enforce the active role server-side.";

function ok(description: string, example?: unknown) {
  return {
    description,
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/SuccessResponse" },
        ...(example ? { example } : {}),
      },
    },
  };
}

const errorResponses = {
  "400": { description: "Validation or business-rule error", content: errJson() },
  "401": { description: "Not authenticated", content: errJson() },
  "403": { description: "Wrong active role / forbidden", content: errJson() },
  "404": { description: "Resource not found", content: errJson() },
  "409": { description: "Conflict (e.g. single-store cart, duplicate)", content: errJson() },
};

function errJson() {
  return {
    "application/json": {
      schema: { $ref: "#/components/schemas/ErrorResponse" },
    },
  };
}

function pick<K extends keyof typeof errorResponses>(...codes: K[]) {
  return Object.fromEntries(codes.map((c) => [c, errorResponses[c]]));
}

const tags = [
  { name: "Auth", description: "Registration, login, session, and active role" },
  { name: "Public", description: "Guest-accessible catalog and reviews" },
  { name: "Buyer", description: "Wallet, addresses, cart, checkout, orders (active role: Buyer)" },
  { name: "Seller", description: "Store, products, incoming orders (active role: Seller)" },
  { name: "Driver", description: "Delivery jobs and earnings (active role: Driver)" },
  { name: "Admin", description: "Monitoring, discounts, overdue, time simulation (active role: Admin)" },
];

export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "SEAPEDIA API",
    version: "1.0.0",
    description:
      "REST API for SEAPEDIA, a multi-role marketplace (Admin, Seller, Buyer, Driver). " +
      bearerNote,
  },
  servers: [{ url: "/api/v1", description: "SEAPEDIA API v1" }],
  tags,
  paths: {
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new account",
        description: "Roles may include BUYER, SELLER, and/or DRIVER (multi-role allowed). ADMIN is seed-only.",
        requestBody: bodyRef("RegisterInput"),
        responses: { "201": ok("Account created; session cookie set"), ...pick("400", "409") },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Log in with username or email",
        requestBody: bodyRef("LoginInput"),
        responses: { "200": ok("Logged in; session cookie set. needsRoleSelection=true for multi-role users"), ...pick("400", "401") },
      },
    },
    "/auth/logout": {
      post: { tags: ["Auth"], summary: "Log out (revokes the session server-side)", responses: { "200": ok("Logged out") } },
    },
    "/auth/me": {
      get: { tags: ["Auth"], summary: "Current user profile with roles and active role", responses: { "200": ok("Profile"), ...pick("401") } },
    },
    "/auth/active-role": {
      post: {
        tags: ["Auth"],
        summary: "Set the active role for this session",
        requestBody: bodyRef("ActiveRoleInput"),
        responses: { "200": ok("Active role updated"), ...pick("400", "401", "403") },
      },
    },
    "/products": {
      get: {
        tags: ["Public"],
        summary: "List catalog products (guest-accessible)",
        parameters: [
          queryParam("search", "Keyword across name, description, store"),
          queryParam("category", "Filter by category"),
          queryParam("store", "Filter by store slug"),
          queryParam("page", "Page number", "integer"),
          queryParam("perPage", "Items per page (max 48)", "integer"),
        ],
        responses: { "200": ok("Paginated products") },
      },
    },
    "/products/{slug}": {
      get: {
        tags: ["Public"],
        summary: "Product detail (guest-accessible)",
        parameters: [pathParam("slug")],
        responses: { "200": ok("Product with store info"), ...pick("404") },
      },
    },
    "/stores/{slug}": {
      get: {
        tags: ["Public"],
        summary: "Public store summary",
        parameters: [pathParam("slug")],
        responses: { "200": ok("Store"), ...pick("404") },
      },
    },
    "/reviews": {
      get: { tags: ["Public"], summary: "List application reviews", responses: { "200": ok("Reviews + average rating") } },
      post: {
        tags: ["Public"],
        summary: "Submit an application review (guests allowed)",
        requestBody: bodyRef("ReviewInput"),
        responses: { "201": ok("Review created"), ...pick("400") },
      },
    },
    "/discounts": {
      get: { tags: ["Public"], summary: "List currently usable vouchers and promos", responses: { "200": ok("Active discounts") } },
    },
    "/wallet": {
      get: { tags: ["Buyer"], summary: "Wallet balance and transaction history", responses: { "200": ok("Wallet"), ...pick("401", "403") } },
    },
    "/wallet/topup": {
      post: {
        tags: ["Buyer"],
        summary: "Dummy top-up (credits the wallet instantly)",
        requestBody: bodyRef("TopUpInput"),
        responses: { "201": ok("Updated wallet"), ...pick("400", "403") },
      },
    },
    "/addresses": {
      get: { tags: ["Buyer"], summary: "List delivery addresses", responses: { "200": ok("Addresses"), ...pick("403") } },
      post: { tags: ["Buyer"], summary: "Create an address", requestBody: bodyRef("AddressInput"), responses: { "201": ok("Address"), ...pick("400", "403") } },
    },
    "/addresses/{id}": {
      put: { tags: ["Buyer"], summary: "Update an address", parameters: [pathParam("id")], requestBody: bodyRef("AddressInput"), responses: { "200": ok("Address"), ...pick("400", "403", "404") } },
      delete: { tags: ["Buyer"], summary: "Delete an address", parameters: [pathParam("id")], responses: { "200": ok("Deleted"), ...pick("403", "404") } },
    },
    "/cart": {
      get: { tags: ["Buyer"], summary: "Get the cart with computed subtotal", responses: { "200": ok("Cart"), ...pick("403") } },
      delete: { tags: ["Buyer"], summary: "Clear the cart", responses: { "200": ok("Empty cart"), ...pick("403") } },
    },
    "/cart/items": {
      post: {
        tags: ["Buyer"],
        summary: "Add a product to the cart",
        description: "Enforces the single-store rule: a 409 is returned when the product belongs to a different store than the current cart.",
        requestBody: bodyRef("CartAddInput"),
        responses: { "201": ok("Updated cart"), ...pick("400", "403", "404", "409") },
      },
    },
    "/cart/items/{id}": {
      put: { tags: ["Buyer"], summary: "Update a cart item quantity", parameters: [pathParam("id")], requestBody: bodyRef("CartUpdateInput"), responses: { "200": ok("Updated cart"), ...pick("400", "403", "404") } },
      delete: { tags: ["Buyer"], summary: "Remove a cart item", parameters: [pathParam("id")], responses: { "200": ok("Updated cart"), ...pick("403", "404") } },
    },
    "/checkout/quote": {
      post: {
        tags: ["Buyer"],
        summary: "Price the cart (subtotal, discount, PPN 12%, delivery, total)",
        requestBody: bodyRef("QuoteInput"),
        responses: { "200": ok("Quote"), ...pick("400", "403", "404") },
      },
    },
    "/orders": {
      get: { tags: ["Buyer"], summary: "Buyer order history", responses: { "200": ok("Orders"), ...pick("403") } },
      post: {
        tags: ["Buyer"],
        summary: "Checkout: create an order from the cart",
        description: "Atomic: guarded stock decrement, wallet charge, voucher consumption, order + status history, cart reset.",
        requestBody: bodyRef("CheckoutInput"),
        responses: { "201": ok("Order created (status Sedang Dikemas)"), ...pick("400", "403", "404") },
      },
    },
    "/orders/{id}": {
      get: { tags: ["Buyer"], summary: "Buyer order detail with status timeline", parameters: [pathParam("id")], responses: { "200": ok("Order"), ...pick("403", "404") } },
    },
    "/buyer/report": {
      get: { tags: ["Buyer"], summary: "Buyer spending report", responses: { "200": ok("Report"), ...pick("403") } },
    },
    "/seller/store": {
      get: { tags: ["Seller"], summary: "Get own store", responses: { "200": ok("Store or null"), ...pick("403") } },
      post: { tags: ["Seller"], summary: "Create store (unique name)", requestBody: bodyRef("StoreInput"), responses: { "201": ok("Store"), ...pick("400", "403", "409") } },
      put: { tags: ["Seller"], summary: "Update store", requestBody: bodyRef("StoreInput"), responses: { "200": ok("Store"), ...pick("400", "403", "404", "409") } },
    },
    "/seller/products": {
      get: { tags: ["Seller"], summary: "List own products", responses: { "200": ok("Products"), ...pick("400", "403") } },
      post: { tags: ["Seller"], summary: "Create a product", requestBody: bodyRef("ProductInput"), responses: { "201": ok("Product"), ...pick("400", "403") } },
    },
    "/seller/products/{id}": {
      put: { tags: ["Seller"], summary: "Update own product", parameters: [pathParam("id")], requestBody: bodyRef("ProductInput"), responses: { "200": ok("Product"), ...pick("400", "403", "404") } },
      delete: { tags: ["Seller"], summary: "Delete own product (soft delete)", parameters: [pathParam("id")], responses: { "200": ok("Deleted"), ...pick("403", "404") } },
    },
    "/seller/orders": {
      get: { tags: ["Seller"], summary: "Incoming orders for the store", responses: { "200": ok("Orders"), ...pick("403") } },
    },
    "/seller/orders/{id}": {
      get: { tags: ["Seller"], summary: "Seller order detail", parameters: [pathParam("id")], responses: { "200": ok("Order"), ...pick("403", "404") } },
    },
    "/seller/orders/{id}/process": {
      post: { tags: ["Seller"], summary: "Process order: Sedang Dikemas -> Menunggu Pengirim", parameters: [pathParam("id")], responses: { "200": ok("Updated order"), ...pick("400", "403", "404") } },
    },
    "/seller/income": {
      get: { tags: ["Seller"], summary: "Seller income report", responses: { "200": ok("Report"), ...pick("403") } },
    },
    "/driver/jobs": {
      get: { tags: ["Driver"], summary: "Available jobs + your active job", responses: { "200": ok("Jobs"), ...pick("403") } },
    },
    "/driver/jobs/{id}": {
      get: { tags: ["Driver"], summary: "Job detail", parameters: [pathParam("id")], responses: { "200": ok("Job"), ...pick("403", "404") } },
    },
    "/driver/jobs/{id}/take": {
      post: { tags: ["Driver"], summary: "Take a job (race-safe): order -> Sedang Dikirim", parameters: [pathParam("id")], responses: { "200": ok("Job"), ...pick("400", "403", "409") } },
    },
    "/driver/jobs/{id}/complete": {
      post: { tags: ["Driver"], summary: "Confirm delivery: order -> Pesanan Selesai", parameters: [pathParam("id")], responses: { "200": ok("Job"), ...pick("400", "403") } },
    },
    "/driver/history": {
      get: { tags: ["Driver"], summary: "Job history and earnings", responses: { "200": ok("History"), ...pick("403") } },
    },
    "/admin/summary": {
      get: { tags: ["Admin"], summary: "Marketplace monitoring summary + virtual clock", responses: { "200": ok("Summary"), ...pick("403") } },
    },
    "/admin/users": { get: { tags: ["Admin"], summary: "List users (no password hashes)", responses: { "200": ok("Users"), ...pick("403") } } },
    "/admin/stores": { get: { tags: ["Admin"], summary: "List stores", responses: { "200": ok("Stores"), ...pick("403") } } },
    "/admin/products": { get: { tags: ["Admin"], summary: "List products", responses: { "200": ok("Products"), ...pick("403") } } },
    "/admin/orders": { get: { tags: ["Admin"], summary: "List orders", responses: { "200": ok("Orders"), ...pick("403") } } },
    "/admin/deliveries": { get: { tags: ["Admin"], summary: "List delivery jobs", responses: { "200": ok("Jobs"), ...pick("403") } } },
    "/admin/overdue": { get: { tags: ["Admin"], summary: "Pending overdue + refunded orders", responses: { "200": ok("Overdue"), ...pick("403") } } },
    "/admin/vouchers": {
      get: { tags: ["Admin"], summary: "List all vouchers", responses: { "200": ok("Vouchers"), ...pick("403") } },
      post: { tags: ["Admin"], summary: "Generate a voucher", requestBody: bodyRef("VoucherInput"), responses: { "201": ok("Voucher"), ...pick("400", "403", "409") } },
    },
    "/admin/vouchers/{id}": { get: { tags: ["Admin"], summary: "Voucher detail", parameters: [pathParam("id")], responses: { "200": ok("Voucher"), ...pick("403", "404") } } },
    "/admin/promos": {
      get: { tags: ["Admin"], summary: "List all promos", responses: { "200": ok("Promos"), ...pick("403") } },
      post: { tags: ["Admin"], summary: "Generate a promo", requestBody: bodyRef("PromoInput"), responses: { "201": ok("Promo"), ...pick("400", "403", "409") } },
    },
    "/admin/promos/{id}": { get: { tags: ["Admin"], summary: "Promo detail", parameters: [pathParam("id")], responses: { "200": ok("Promo"), ...pick("403", "404") } } },
    "/admin/time": { get: { tags: ["Admin"], summary: "Read the virtual clock", responses: { "200": ok("Clock"), ...pick("403") } } },
    "/admin/simulate-next-day": {
      post: { tags: ["Admin"], summary: "Advance the clock one day and sweep overdue orders", responses: { "200": ok("Sweep result + clock"), ...pick("403") } },
    },
    "/admin/run-overdue-check": {
      post: { tags: ["Admin"], summary: "Run the overdue sweep without moving the clock", responses: { "200": ok("Sweep result"), ...pick("403") } },
    },
  },
  components: {
    schemas: {
      SuccessResponse: {
        type: "object",
        properties: { success: { type: "boolean", example: true }, data: {} },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          error: { type: "string", example: "Data tidak valid — rating: Rating maksimal 5" },
        },
      },
      RegisterInput: {
        type: "object",
        required: ["username", "name", "email", "password", "roles"],
        properties: {
          username: { type: "string", example: "budisantoso" },
          name: { type: "string", example: "Budi Santoso" },
          email: { type: "string", format: "email", example: "budi@mail.com" },
          phone: { type: "string", example: "081234567890" },
          password: { type: "string", minLength: 8, example: "seapedia123" },
          roles: { type: "array", items: { type: "string", enum: ["BUYER", "SELLER", "DRIVER"] }, example: ["BUYER", "SELLER"] },
        },
      },
      LoginInput: {
        type: "object",
        required: ["identifier", "password"],
        properties: {
          identifier: { type: "string", example: "budi", description: "Username or email" },
          password: { type: "string", example: "seapedia123" },
        },
      },
      ActiveRoleInput: {
        type: "object",
        required: ["role"],
        properties: { role: { type: "string", enum: ["ADMIN", "SELLER", "BUYER", "DRIVER"], example: "SELLER" } },
      },
      ReviewInput: {
        type: "object",
        required: ["name", "rating", "comment"],
        properties: {
          name: { type: "string", example: "Citra" },
          rating: { type: "integer", minimum: 1, maximum: 5, example: 5 },
          comment: { type: "string", example: "Aplikasinya nyaman dipakai!" },
        },
      },
      TopUpInput: {
        type: "object",
        required: ["amount"],
        properties: { amount: { type: "integer", minimum: 10000, example: 100000 } },
      },
      AddressInput: {
        type: "object",
        required: ["label", "recipient", "phone", "street", "city", "province", "postalCode"],
        properties: {
          label: { type: "string", example: "Rumah" },
          recipient: { type: "string", example: "Citra Lestari" },
          phone: { type: "string", example: "081234567890" },
          street: { type: "string", example: "Jl. Melati No. 12" },
          city: { type: "string", example: "Jakarta Selatan" },
          province: { type: "string", example: "DKI Jakarta" },
          postalCode: { type: "string", example: "12430" },
          isDefault: { type: "boolean", example: true },
        },
      },
      CartAddInput: {
        type: "object",
        required: ["productId", "quantity"],
        properties: { productId: { type: "string" }, quantity: { type: "integer", minimum: 1, example: 2 } },
      },
      CartUpdateInput: {
        type: "object",
        required: ["quantity"],
        properties: { quantity: { type: "integer", minimum: 1, example: 3 } },
      },
      QuoteInput: {
        type: "object",
        required: ["deliveryMethod"],
        properties: {
          deliveryMethod: { type: "string", enum: ["INSTANT", "NEXT_DAY", "REGULAR"], example: "REGULAR" },
          discountCode: { type: "string", example: "HEMAT10" },
        },
      },
      CheckoutInput: {
        type: "object",
        required: ["addressId", "deliveryMethod"],
        properties: {
          addressId: { type: "string" },
          deliveryMethod: { type: "string", enum: ["INSTANT", "NEXT_DAY", "REGULAR"], example: "INSTANT" },
          discountCode: { type: "string", example: "HEMAT10" },
        },
      },
      StoreInput: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", example: "Toko Berkah Jaya" },
          description: { type: "string", example: "Toko serba ada terpercaya." },
          city: { type: "string", example: "Bandung" },
        },
      },
      ProductInput: {
        type: "object",
        required: ["name", "description", "price", "stock"],
        properties: {
          name: { type: "string", example: "Headphone Bluetooth Pro" },
          description: { type: "string", example: "Headphone nirkabel dengan noise cancelling." },
          price: { type: "integer", minimum: 500, example: 459000 },
          stock: { type: "integer", minimum: 0, example: 25 },
          imageUrl: { type: "string", format: "uri", example: "https://images.unsplash.com/photo-..." },
          category: { type: "string", example: "Elektronik" },
        },
      },
      VoucherInput: {
        type: "object",
        required: ["code", "name", "valueType", "value", "expiresAt", "maxUsage"],
        properties: {
          code: { type: "string", example: "HEMAT20" },
          name: { type: "string", example: "Diskon 20%" },
          valueType: { type: "string", enum: ["PERCENT", "FIXED"], example: "PERCENT" },
          value: { type: "integer", example: 20 },
          maxDiscount: { type: "integer", example: 50000 },
          minSubtotal: { type: "integer", example: 100000 },
          expiresAt: { type: "string", format: "date-time" },
          maxUsage: { type: "integer", example: 100 },
        },
      },
      PromoInput: {
        type: "object",
        required: ["code", "name", "valueType", "value", "expiresAt"],
        properties: {
          code: { type: "string", example: "GAJIAN12" },
          name: { type: "string", example: "Promo Gajian 12%" },
          valueType: { type: "string", enum: ["PERCENT", "FIXED"], example: "PERCENT" },
          value: { type: "integer", example: 12 },
          maxDiscount: { type: "integer", example: 60000 },
          minSubtotal: { type: "integer", example: 200000 },
          expiresAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
} as const;

function bodyRef(schema: string) {
  return {
    required: true,
    content: { "application/json": { schema: { $ref: `#/components/schemas/${schema}` } } },
  };
}

function pathParam(name: string) {
  return { name, in: "path", required: true, schema: { type: "string" } };
}

function queryParam(name: string, description: string, type = "string") {
  return { name, in: "query", required: false, description, schema: { type } };
}
