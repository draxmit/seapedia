/**
 * SEAPEDIA demo seed.
 *
 * Creates demo accounts for every role (password: seapedia123), six stores
 * with a realistic catalog, orders in every lifecycle status, vouchers and
 * promos (valid, expired, and exhausted), plus one already-overdue order so
 * the auto-refund flow can be demonstrated immediately.
 *
 * Run with: npx prisma db seed
 */
import {
  PrismaClient,
  type DeliveryMethod,
  type OrderStatus,
  type Prisma,
  type User,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PASSWORD = "seapedia123";
const DAY_MS = 24 * 60 * 60 * 1000;
const PPN_RATE = 0.12;
const DELIVERY_FEES: Record<DeliveryMethod, number> = {
  INSTANT: 25000,
  NEXT_DAY: 15000,
  REGULAR: 8000,
};
const SLA_DAYS: Record<DeliveryMethod, number> = {
  INSTANT: 0,
  NEXT_DAY: 1,
  REGULAR: 3,
};

const img = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=80`;

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * DAY_MS);
}

function daysFromNow(n: number): Date {
  return new Date(Date.now() + n * DAY_MS);
}

async function main() {
  console.log("Seeding SEAPEDIA…");
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  // Wipe in dependency order so the seed is idempotent
  await prisma.$transaction([
    prisma.orderStatusHistory.deleteMany(),
    prisma.deliveryJob.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.cartItem.deleteMany(),
    prisma.cart.deleteMany(),
    prisma.walletTransaction.deleteMany(),
    prisma.wallet.deleteMany(),
    prisma.address.deleteMany(),
    prisma.appReview.deleteMany(),
    prisma.product.deleteMany(),
    prisma.store.deleteMany(),
    prisma.voucher.deleteMany(),
    prisma.promo.deleteMany(),
    prisma.session.deleteMany(),
    prisma.userRole.deleteMany(),
    prisma.user.deleteMany(),
    prisma.appConfig.deleteMany(),
  ]);

  await prisma.appConfig.create({ data: { id: 1, virtualDayOffset: 0 } });

  // ============================== Users ==============================
  type UserSpec = {
    username: string;
    name: string;
    email: string;
    phone?: string;
    roles: ("ADMIN" | "SELLER" | "BUYER" | "DRIVER")[];
  };

  const userSpecs: UserSpec[] = [
    { username: "admin", name: "Admin SEAPEDIA", email: "admin@seapedia.id", roles: ["ADMIN"] },
    { username: "budi", name: "Budi Santoso", email: "budi@mail.com", phone: "081234567801", roles: ["SELLER"] },
    { username: "rina", name: "Rina Wulandari", email: "rina@mail.com", phone: "081234567802", roles: ["SELLER"] },
    { username: "andi", name: "Andi Wijaya", email: "andi@mail.com", phone: "081234567803", roles: ["SELLER", "BUYER"] },
    { username: "kurnia", name: "Kurnia Dewi", email: "kurnia@mail.com", phone: "081234567804", roles: ["SELLER"] },
    { username: "sari", name: "Sari Melati", email: "sari@mail.com", phone: "081234567805", roles: ["SELLER"] },
    { username: "citra", name: "Citra Lestari", email: "citra@mail.com", phone: "081234567806", roles: ["BUYER"] },
    { username: "dimas", name: "Dimas Pratama", email: "dimas@mail.com", phone: "081234567807", roles: ["BUYER", "DRIVER"] },
    { username: "rudi", name: "Rudi Hartono", email: "rudi@mail.com", phone: "081234567808", roles: ["DRIVER"] },
    { username: "maya", name: "Maya Anggraini", email: "maya@mail.com", phone: "081234567809", roles: ["BUYER", "SELLER", "DRIVER"] },
  ];

  const users: Record<string, User> = {};
  for (const spec of userSpecs) {
    users[spec.username] = await prisma.user.create({
      data: {
        username: spec.username,
        name: spec.name,
        email: spec.email,
        phone: spec.phone,
        passwordHash,
        roles: { create: spec.roles.map((role) => ({ role })) },
        wallet: { create: { balance: 0 } },
        cart: { create: {} },
      },
    });
  }
  console.log(`  ${userSpecs.length} users`);

  // ============================== Stores =============================
  const storeSpecs = [
    {
      owner: "budi",
      name: "Elektronik Pak Budi",
      city: "Jakarta Barat",
      description: "Gadget dan aksesori elektronik original bergaransi resmi.",
    },
    {
      owner: "rina",
      name: "Dapur Bu Rina",
      city: "Bandung",
      description: "Camilan rumahan dan bahan dapur pilihan, selalu fresh.",
    },
    {
      owner: "andi",
      name: "Gadget Zone",
      city: "Surabaya",
      description: "Pusat gadget second berkualitas dan aksesori kekinian.",
    },
    {
      owner: "kurnia",
      name: "Kurnia Fashion",
      city: "Yogyakarta",
      description: "Fashion pria & wanita, dari kasual sampai formal.",
    },
    {
      owner: "sari",
      name: "Rumah Hijau Sari",
      city: "Bogor",
      description: "Tanaman hias, peralatan berkebun, dan dekorasi rumah asri.",
    },
    {
      owner: "maya",
      name: "Maya Beauty House",
      city: "Semarang",
      description: "Skincare dan kosmetik BPOM dengan harga bersahabat.",
    },
  ];

  const stores: Record<string, { id: string }> = {};
  for (const s of storeSpecs) {
    stores[s.owner] = await prisma.store.create({
      data: {
        ownerId: users[s.owner].id,
        name: s.name,
        slug: slugify(s.name),
        city: s.city,
        description: s.description,
      },
    });
  }
  console.log(`  ${storeSpecs.length} stores`);

  // ============================= Products ============================
  type ProductSpec = {
    store: string;
    name: string;
    price: number;
    stock: number;
    category: string;
    image: string;
    description: string;
  };

  const productSpecs: ProductSpec[] = [
    // Elektronik Pak Budi
    { store: "budi", name: "Headphone Bluetooth OverEar Pro", price: 459000, stock: 25, category: "Elektronik", image: img("photo-1505740420928-5e560c06d30e"), description: "Headphone nirkabel dengan noise cancelling aktif, baterai 40 jam, dan bass yang dalam. Cocok untuk kerja maupun gaming." },
    { store: "budi", name: "Smartwatch Fit Series 5", price: 899000, stock: 18, category: "Elektronik", image: img("photo-1523275335684-37898b6baf30"), description: "Jam tangan pintar dengan monitor detak jantung, GPS, dan tahan air 5ATM. Teman terbaik untuk gaya hidup aktif." },
    { store: "budi", name: "Keyboard Mekanikal RGB TKL", price: 685000, stock: 30, category: "Elektronik", image: img("photo-1541140532154-b024d705b90a"), description: "Keyboard mekanikal switch blue dengan lampu RGB per tombol dan build aluminium yang kokoh." },
    { store: "budi", name: "Speaker Bluetooth Mini Boom", price: 275000, stock: 40, category: "Elektronik", image: img("photo-1608043152269-423dbba4e7e1"), description: "Speaker portabel suara 360 derajat, tahan cipratan air, baterai 12 jam. Pas untuk piknik dan kamar kos." },
    { store: "budi", name: "Earbuds TWS ClearSound", price: 329000, stock: 50, category: "Elektronik", image: img("photo-1572569511254-d8f925fe2cbb"), description: "True wireless earbuds dengan mikrofon jernih untuk meeting online dan latensi rendah untuk gaming." },
    { store: "budi", name: "Lampu Meja LED Minimalis", price: 189000, stock: 35, category: "Rumah Tangga", image: img("photo-1507473885765-e6ed057f782c"), description: "Lampu belajar LED 3 mode warna dengan lengan fleksibel dan port USB charging." },

    // Dapur Bu Rina
    { store: "rina", name: "Kopi Arabika Gayo 500g", price: 98000, stock: 60, category: "Makanan & Minuman", image: img("photo-1447933601403-0c6688de566e"), description: "Biji kopi arabika Gayo single origin, roast medium. Aroma floral dengan aftertaste cokelat." },
    { store: "rina", name: "Madu Hutan Murni 650ml", price: 135000, stock: 45, category: "Makanan & Minuman", image: img("photo-1587049352846-4a222e784d38"), description: "Madu hutan asli tanpa campuran, dipanen dari lebah liar Sumatera. Kental dan kaya rasa." },
    { store: "rina", name: "Cookies Cokelat Premium 250g", price: 55000, stock: 80, category: "Makanan & Minuman", image: img("photo-1499636136210-6f4ee915583e"), description: "Kukis cokelat renyah dengan choco chips melimpah. Dibuat fresh setiap hari tanpa pengawet." },
    { store: "rina", name: "Cokelat Artisan Dark 70%", price: 78000, stock: 55, category: "Makanan & Minuman", image: img("photo-1549007994-cb92caebd54b"), description: "Cokelat batangan dark 70% dari kakao Jembrana, Bali. Pahit elegan dengan sentuhan fruity." },
    { store: "rina", name: "Teh Hijau Organik 40 Kantong", price: 42000, stock: 70, category: "Makanan & Minuman", image: img("photo-1564890369478-c89ca6d9cde9"), description: "Teh hijau organik pegunungan, dipetik pucuk terbaik. Segar, ringan, dan kaya antioksidan." },

    // Gadget Zone
    { store: "andi", name: "Kamera Mirrorless Lensa Kit", price: 7250000, stock: 8, category: "Elektronik", image: img("photo-1526170375885-4d8ecf77b99f"), description: "Kamera mirrorless 24MP dengan lensa kit 16-50mm. Kondisi mulus, garansi toko 6 bulan." },
    { store: "andi", name: "Laptop Ultrabook 14 inci", price: 8950000, stock: 12, category: "Elektronik", image: img("photo-1496181133206-80ce9b88a853"), description: "Ultrabook tipis 1.2kg dengan prosesor hemat daya, RAM 16GB, dan SSD 512GB. Siap kerja seharian." },
    { store: "andi", name: "Smartphone AMOLED 8/256", price: 4599000, stock: 20, category: "Elektronik", image: img("photo-1511707171634-5f897ff02aa9"), description: "Smartphone layar AMOLED 120Hz, RAM 8GB, memori 256GB, kamera utama 108MP. Segel resmi." },
    { store: "andi", name: "Mouse Wireless Ergonomis", price: 245000, stock: 45, category: "Elektronik", image: img("photo-1527864550417-7fd91fc51a46"), description: "Mouse nirkabel senyap dengan desain ergonomis dan DPI yang bisa diatur hingga 3200." },

    // Kurnia Fashion
    { store: "kurnia", name: "Sneakers Runner Classic", price: 559000, stock: 32, category: "Fashion", image: img("photo-1542291026-7eec264c27ff"), description: "Sneakers lari ringan dengan bantalan empuk dan outsole anti-slip. Nyaman dipakai seharian." },
    { store: "kurnia", name: "Jam Tangan Kulit Heritage", price: 745000, stock: 15, category: "Fashion", image: img("photo-1524592094714-0f0654e20314"), description: "Jam tangan analog klasik dengan tali kulit asli dan mesin quartz Jepang yang presisi." },
    { store: "kurnia", name: "Jaket Denim Washed", price: 385000, stock: 28, category: "Fashion", image: img("photo-1551537482-f2075a1d41f2"), description: "Jaket denim unisex dengan efek washed vintage. Bahan tebal namun tetap breathable." },
    { store: "kurnia", name: "Kaos Katun Premium Polos", price: 89000, stock: 100, category: "Fashion", image: img("photo-1521572163474-6864f9cf17ab"), description: "Kaos katun combed 30s dengan jahitan rapi. Adem, menyerap keringat, tersedia banyak warna." },
    { store: "kurnia", name: "Kacamata Retro Round", price: 165000, stock: 40, category: "Fashion", image: img("photo-1572635196237-14b3f281503f"), description: "Kacamata gaya retro dengan proteksi UV400 dan frame ringan yang nyaman." },
    { store: "kurnia", name: "Tas Ransel Urban 20L", price: 299000, stock: 36, category: "Fashion", image: img("photo-1553062407-98eeb64c6a62"), description: "Ransel minimalis 20L dengan slot laptop 15 inci, bahan tahan air, dan banyak kompartemen." },

    // Rumah Hijau Sari
    { store: "sari", name: "Monstera Deliciosa Pot 25cm", price: 145000, stock: 22, category: "Rumah Tangga", image: img("photo-1485955900006-10f4d324d411"), description: "Tanaman hias monstera sehat dengan 5-7 daun, sudah termasuk pot. Perawatan mudah." },
    { store: "sari", name: "Mug Keramik Handmade", price: 68000, stock: 50, category: "Rumah Tangga", image: img("photo-1514228742587-6b1558fcca3d"), description: "Mug keramik buatan tangan dengan glasir matte. Setiap mug unik, kapasitas 300ml." },
    { store: "sari", name: "Kursi Kayu Skandinavia", price: 850000, stock: 10, category: "Rumah Tangga", image: img("photo-1503602642458-232111445657"), description: "Kursi kayu jati belanda gaya skandinavia dengan finishing halus dan dudukan nyaman." },
    { store: "sari", name: "Lilin Aromaterapi Lavender", price: 95000, stock: 60, category: "Rumah Tangga", image: img("photo-1603006905003-be475563bc59"), description: "Lilin aromaterapi soy wax dengan essential oil lavender asli. Waktu bakar ±35 jam." },
    { store: "sari", name: "Sepeda Lipat Commuter", price: 2450000, stock: 6, category: "Olahraga", image: img("photo-1485965120184-e220f721d03e"), description: "Sepeda lipat ringan 7 speed, cocok untuk komuter kota. Bisa masuk bagasi mobil." },
    { store: "sari", name: "Matras Yoga Anti-Slip 6mm", price: 175000, stock: 44, category: "Olahraga", image: img("photo-1592432678016-e910b452f9a2"), description: "Matras yoga TPE ramah lingkungan, permukaan anti-slip dua sisi, bonus tali strap." },

    // Maya Beauty House
    { store: "maya", name: "Serum Wajah Vitamin C", price: 129000, stock: 65, category: "Kecantikan", image: img("photo-1556228720-195a672e8a03"), description: "Serum brightening dengan vitamin C 10% dan niacinamide. Tekstur ringan, cepat meresap. BPOM." },
    { store: "maya", name: "Parfum Eau de Parfum 50ml", price: 385000, stock: 25, category: "Kecantikan", image: img("photo-1541643600914-78b084683601"), description: "Parfum unisex dengan notes citrus, cedarwood, dan musk. Tahan 8-10 jam di kulit." },
    { store: "maya", name: "Sabun Natural Oatmeal", price: 35000, stock: 90, category: "Kecantikan", image: img("photo-1600857544200-b2f666a9a2ec"), description: "Sabun batang natural dengan oatmeal dan madu. Lembut untuk kulit sensitif, tanpa SLS." },
    { store: "maya", name: "Sneakers Putih Minimalis", price: 465000, stock: 30, category: "Fashion", image: img("photo-1595950653106-6c9ebd614d3a"), description: "Sneakers putih clean look yang cocok untuk segala outfit. Upper kulit sintetis premium." },
    { store: "maya", name: "Topi Baseball Klasik", price: 79000, stock: 55, category: "Fashion", image: img("photo-1588850561407-ed78c282e89b"), description: "Topi baseball katun twill dengan strap adjustable. Simple dan cocok untuk harian." },
    { store: "maya", name: "Dumbbell Set 2x5kg", price: 320000, stock: 20, category: "Olahraga", image: img("photo-1638536532686-d610adfc8e5c"), description: "Sepasang dumbbell 5kg berlapis neoprene, nyaman digenggam dan tidak licin." },
  ];

  const products: { id: string; name: string; price: number; store: string; imageUrl: string }[] = [];
  for (const p of productSpecs) {
    const created = await prisma.product.create({
      data: {
        storeId: stores[p.store].id,
        name: p.name,
        slug: slugify(p.name),
        description: p.description,
        price: p.price,
        stock: p.stock,
        category: p.category,
        imageUrl: p.image,
      },
    });
    products.push({ id: created.id, name: p.name, price: p.price, store: p.store, imageUrl: p.image });
  }
  console.log(`  ${productSpecs.length} products`);

  // ============================ Addresses ============================
  const addressSpecs = [
    { user: "citra", label: "Rumah", recipient: "Citra Lestari", phone: "081234567806", street: "Jl. Melati No. 12, RT 04/RW 02", city: "Jakarta Selatan", province: "DKI Jakarta", postalCode: "12430", isDefault: true },
    { user: "citra", label: "Kantor", recipient: "Citra Lestari", phone: "081234567806", street: "Gedung Cyber Lt. 5, Jl. Kuningan Barat", city: "Jakarta Selatan", province: "DKI Jakarta", postalCode: "12710", isDefault: false },
    { user: "dimas", label: "Kos", recipient: "Dimas Pratama", phone: "081234567807", street: "Jl. Kaliurang KM 5 Gang Pandega 7", city: "Sleman", province: "DI Yogyakarta", postalCode: "55281", isDefault: true },
    { user: "andi", label: "Rumah", recipient: "Andi Wijaya", phone: "081234567803", street: "Jl. Diponegoro No. 88", city: "Surabaya", province: "Jawa Timur", postalCode: "60241", isDefault: true },
    { user: "maya", label: "Rumah", recipient: "Maya Anggraini", phone: "081234567809", street: "Jl. Pandanaran No. 45", city: "Semarang", province: "Jawa Tengah", postalCode: "50134", isDefault: true },
  ];
  const addresses: Record<string, { id: string; recipient: string; phone: string; full: string }> = {};
  for (const a of addressSpecs) {
    const created = await prisma.address.create({
      data: {
        userId: users[a.user].id,
        label: a.label,
        recipient: a.recipient,
        phone: a.phone,
        street: a.street,
        city: a.city,
        province: a.province,
        postalCode: a.postalCode,
        isDefault: a.isDefault,
      },
    });
    if (a.isDefault) {
      addresses[a.user] = {
        id: created.id,
        recipient: a.recipient,
        phone: a.phone,
        full: `${a.street}, ${a.city}, ${a.province} ${a.postalCode}`,
      };
    }
  }
  console.log(`  ${addressSpecs.length} addresses`);

  // ======================= Vouchers & Promos ==========================
  await prisma.voucher.createMany({
    data: [
      { code: "HEMAT10", name: "Voucher Hemat 10%", valueType: "PERCENT", value: 10, maxDiscount: 50000, minSubtotal: 100000, expiresAt: daysFromNow(30), maxUsage: 100, usedCount: 3 },
      { code: "DISKON25K", name: "Potongan Rp25.000", valueType: "FIXED", value: 25000, minSubtotal: 150000, expiresAt: daysFromNow(14), maxUsage: 50, usedCount: 1 },
      { code: "KADALUARSA", name: "Voucher Lama (Kedaluwarsa)", valueType: "PERCENT", value: 15, maxDiscount: 30000, minSubtotal: 0, expiresAt: daysAgo(3), maxUsage: 100, usedCount: 12 },
      { code: "HABISPAKAI", name: "Voucher Habis Kuota", valueType: "FIXED", value: 20000, minSubtotal: 0, expiresAt: daysFromNow(30), maxUsage: 5, usedCount: 5 },
    ],
  });
  await prisma.promo.createMany({
    data: [
      { code: "GAJIAN12", name: "Promo Gajian 12%", valueType: "PERCENT", value: 12, maxDiscount: 60000, minSubtotal: 200000, expiresAt: daysFromNow(20) },
      { code: "ONGKIRHEMAT", name: "Promo Potongan Rp15.000", valueType: "FIXED", value: 15000, minSubtotal: 100000, expiresAt: daysFromNow(10) },
      { code: "PROMOLALU", name: "Promo Berakhir", valueType: "PERCENT", value: 20, maxDiscount: 40000, minSubtotal: 0, expiresAt: daysAgo(5) },
    ],
  });
  console.log("  4 vouchers, 3 promos");

  // ============================= Wallets =============================
  // Big top-ups so demo checkouts never fail on balance
  const walletPlan: Record<string, number> = {
    citra: 15000000,
    dimas: 5000000,
    andi: 20000000,
    maya: 8000000,
  };
  const balances: Record<string, number> = {};
  for (const [username, amount] of Object.entries(walletPlan)) {
    balances[username] = amount;
    await prisma.wallet.update({
      where: { userId: users[username].id },
      data: {
        balance: amount,
        transactions: {
          create: {
            type: "TOPUP",
            amount,
            balanceAfter: amount,
            note: "Top up saldo (demo)",
            createdAt: daysAgo(6),
          },
        },
      },
    });
  }

  // ============================== Orders =============================
  const today = Math.floor(Date.now() / DAY_MS);
  let orderSeq = 1;

  type OrderSpec = {
    buyer: string;
    store: string;
    items: { name: string; qty: number }[];
    method: DeliveryMethod;
    status: OrderStatus;
    /** Real days ago the order was placed (drives timestamps + SLA). */
    placedDaysAgo: number;
    voucher?: { code: string; kind: "VOUCHER" | "PROMO"; amount: number };
    driver?: string;
    /** Force an overdue dueOnDay for the auto-refund demo. */
    overdue?: boolean;
  };

  const orderSpecs: OrderSpec[] = [
    {
      buyer: "citra", store: "budi", method: "REGULAR", status: "PESANAN_SELESAI", placedDaysAgo: 5, driver: "rudi",
      items: [ { name: "Headphone Bluetooth OverEar Pro", qty: 1 }, { name: "Earbuds TWS ClearSound", qty: 1 } ],
      voucher: { code: "HEMAT10", kind: "VOUCHER", amount: 50000 },
    },
    {
      buyer: "citra", store: "rina", method: "NEXT_DAY", status: "PESANAN_SELESAI", placedDaysAgo: 4, driver: "dimas",
      items: [ { name: "Kopi Arabika Gayo 500g", qty: 2 }, { name: "Cookies Cokelat Premium 250g", qty: 3 } ],
    },
    {
      buyer: "dimas", store: "kurnia", method: "REGULAR", status: "SEDANG_DIKIRIM", placedDaysAgo: 2, driver: "rudi",
      items: [ { name: "Sneakers Runner Classic", qty: 1 } ],
      voucher: { code: "GAJIAN12", kind: "PROMO", amount: 60000 },
    },
    {
      buyer: "andi", store: "sari", method: "NEXT_DAY", status: "MENUNGGU_PENGIRIM", placedDaysAgo: 1,
      items: [ { name: "Monstera Deliciosa Pot 25cm", qty: 2 }, { name: "Lilin Aromaterapi Lavender", qty: 1 } ],
    },
    {
      buyer: "maya", store: "budi", method: "INSTANT", status: "SEDANG_DIKEMAS", placedDaysAgo: 0,
      items: [ { name: "Speaker Bluetooth Mini Boom", qty: 1 } ],
    },
    {
      buyer: "citra", store: "maya", method: "INSTANT", status: "SEDANG_DIKEMAS", placedDaysAgo: 0,
      items: [ { name: "Serum Wajah Vitamin C", qty: 2 }, { name: "Sabun Natural Oatmeal", qty: 3 } ],
    },
    {
      // Refunded example: already went through the overdue flow
      buyer: "dimas", store: "rina", method: "INSTANT", status: "DIKEMBALIKAN", placedDaysAgo: 3,
      items: [ { name: "Madu Hutan Murni 650ml", qty: 1 } ],
    },
    {
      // OVERDUE demo: INSTANT placed yesterday, still waiting for a driver.
      // Due day has passed — one click of "Jalankan Pengecekan Overdue"
      // (or simulate next day) refunds it.
      buyer: "andi", store: "kurnia", method: "INSTANT", status: "MENUNGGU_PENGIRIM", placedDaysAgo: 1, overdue: true,
      items: [ { name: "Jam Tangan Kulit Heritage", qty: 1 } ],
    },
  ];

  for (const spec of orderSpecs) {
    const buyer = users[spec.buyer];
    const store = stores[spec.store];
    const address = addresses[spec.buyer];
    const placedAt = daysAgo(spec.placedDaysAgo);
    const placedOnDay = today - spec.placedDaysAgo;
    const dueOnDay = placedOnDay + SLA_DAYS[spec.method];

    const items = spec.items.map((it) => {
      const product = products.find((p) => p.name === it.name)!;
      return {
        productId: product.id,
        productName: product.name,
        productImage: product.imageUrl,
        unitPrice: product.price,
        quantity: it.qty,
        lineTotal: product.price * it.qty,
      };
    });
    const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
    const discountAmount = spec.voucher?.amount ?? 0;
    const taxAmount = Math.round((subtotal - discountAmount) * PPN_RATE);
    const deliveryFee = DELIVERY_FEES[spec.method];
    const total = subtotal - discountAmount + taxAmount + deliveryFee;

    // Timeline: each later status a few hours after the previous one
    const HOUR = 60 * 60 * 1000;
    const historyByStatus: { status: OrderStatus; at: Date; note: string; actor: string }[] = [
      { status: "SEDANG_DIKEMAS", at: placedAt, note: "Pesanan dibuat dan pembayaran diterima", actor: "system" },
    ];
    const reached = (s: OrderStatus) => {
      const chain: OrderStatus[] = ["SEDANG_DIKEMAS", "MENUNGGU_PENGIRIM", "SEDANG_DIKIRIM", "PESANAN_SELESAI"];
      if (spec.status === "DIKEMBALIKAN") return s === "SEDANG_DIKEMAS";
      return chain.indexOf(s) <= chain.indexOf(spec.status);
    };
    if (reached("MENUNGGU_PENGIRIM") && spec.status !== "SEDANG_DIKEMAS") {
      historyByStatus.push({ status: "MENUNGGU_PENGIRIM", at: new Date(placedAt.getTime() + 3 * HOUR), note: "Penjual selesai mengemas pesanan", actor: "seller" });
    }
    if (reached("SEDANG_DIKIRIM") && ["SEDANG_DIKIRIM", "PESANAN_SELESAI"].includes(spec.status)) {
      historyByStatus.push({ status: "SEDANG_DIKIRIM", at: new Date(placedAt.getTime() + 6 * HOUR), note: "Driver mengambil pesanan", actor: "driver" });
    }
    if (spec.status === "PESANAN_SELESAI") {
      historyByStatus.push({ status: "PESANAN_SELESAI", at: new Date(placedAt.getTime() + 20 * HOUR), note: "Pesanan diterima pembeli", actor: "driver" });
    }
    if (spec.status === "DIKEMBALIKAN") {
      historyByStatus.push({ status: "DIKEMBALIKAN", at: new Date(placedAt.getTime() + 30 * HOUR), note: "Pesanan melewati batas SLA — dana dikembalikan otomatis ke dompet", actor: "system" });
    }

    const code = `SEA-${placedAt.toISOString().slice(2, 10).replace(/-/g, "")}-${String(orderSeq++).padStart(3, "0")}`;

    const order = await prisma.order.create({
      data: {
        code,
        buyerId: buyer.id,
        storeId: store.id,
        status: spec.status,
        deliveryMethod: spec.method,
        recipient: address.recipient,
        phone: address.phone,
        fullAddress: address.full,
        subtotal,
        discountAmount,
        discountCode: spec.voucher?.code,
        discountKind: spec.voucher?.kind,
        taxAmount,
        deliveryFee,
        total,
        placedOnDay,
        dueOnDay: spec.overdue ? placedOnDay : dueOnDay,
        incomeCounted: spec.status === "PESANAN_SELESAI",
        incomeReversed: false,
        refundedAt: spec.status === "DIKEMBALIKAN" ? new Date(placedAt.getTime() + 30 * HOUR) : null,
        createdAt: placedAt,
        items: { create: items },
        statusHistory: {
          create: historyByStatus.map((h) => ({
            status: h.status,
            note: h.note,
            actor: h.actor,
            createdAt: h.at,
          })),
        },
      },
    });

    // Delivery job mirrors the order state
    if (spec.status !== "SEDANG_DIKEMAS") {
      const jobStatus =
        spec.status === "MENUNGGU_PENGIRIM"
          ? "AVAILABLE"
          : spec.status === "SEDANG_DIKIRIM"
            ? "TAKEN"
            : spec.status === "PESANAN_SELESAI"
              ? "COMPLETED"
              : "CANCELLED";
      await prisma.deliveryJob.create({
        data: {
          orderId: order.id,
          driverId: spec.driver ? users[spec.driver].id : null,
          status: jobStatus,
          fee: deliveryFee,
          takenAt: ["TAKEN", "COMPLETED"].includes(jobStatus) ? new Date(placedAt.getTime() + 6 * HOUR) : null,
          completedAt: jobStatus === "COMPLETED" ? new Date(placedAt.getTime() + 20 * HOUR) : null,
          createdAt: new Date(placedAt.getTime() + 3 * HOUR),
        },
      });
    }

    // Wallet: PAYMENT always; REFUND for the returned order
    const buyerBalance = balances[spec.buyer] - total;
    balances[spec.buyer] = buyerBalance;
    const wallet = await prisma.wallet.findUnique({ where: { userId: buyer.id } });
    await prisma.walletTransaction.create({
      data: {
        walletId: wallet!.id,
        type: "PAYMENT",
        amount: -total,
        balanceAfter: buyerBalance,
        note: `Pembayaran pesanan ${code}`,
        orderId: order.id,
        createdAt: placedAt,
      },
    });
    if (spec.status === "DIKEMBALIKAN") {
      balances[spec.buyer] += total;
      await prisma.walletTransaction.create({
        data: {
          walletId: wallet!.id,
          type: "REFUND",
          amount: total,
          balanceAfter: balances[spec.buyer],
          note: `Refund otomatis pesanan ${code} (melewati SLA)`,
          orderId: order.id,
          createdAt: new Date(placedAt.getTime() + 30 * HOUR),
        },
      });
    }
    await prisma.wallet.update({
      where: { id: wallet!.id },
      data: { balance: balances[spec.buyer] },
    });

    // Reduce stock as if checkout really happened
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }
  }
  console.log(`  ${orderSpecs.length} orders (all lifecycle statuses)`);

  // =========================== App reviews ===========================
  const reviewSpecs: Prisma.AppReviewCreateManyInput[] = [
    { name: "Citra Lestari", rating: 5, comment: "Checkout-nya gampang banget dan rincian PPN-nya transparan. Suka!", userId: users.citra.id, createdAt: daysAgo(4) },
    { name: "Dimas Pratama", rating: 5, comment: "Satu akun bisa jadi pembeli sekaligus driver. Konsepnya keren dan praktis.", userId: users.dimas.id, createdAt: daysAgo(4) },
    { name: "Budi Santoso", rating: 4, comment: "Kelola produk toko sangat mudah, dashboard penjualnya rapi dan informatif.", userId: users.budi.id, createdAt: daysAgo(3) },
    { name: "Anonim Pengunjung", rating: 4, comment: "Belum daftar tapi sudah bisa lihat-lihat produk dengan nyaman. UI-nya bersih.", createdAt: daysAgo(3) },
    { name: "Maya Anggraini", rating: 5, comment: "Tracking pesanan jelas dari dikemas sampai selesai. Refund otomatis juga jalan.", userId: users.maya.id, createdAt: daysAgo(2) },
    { name: "Rudi Hartono", rating: 4, comment: "Ambil job pengiriman gampang, penghasilannya langsung kelihatan di dashboard.", userId: users.rudi.id, createdAt: daysAgo(2) },
    { name: "Sari Melati", rating: 5, comment: "Buka toko tanaman di sini prosesnya cepat. Nama toko unik langsung diverifikasi.", userId: users.sari.id, createdAt: daysAgo(1) },
    { name: "Pengunjung Baru", rating: 4, comment: "Website-nya responsif dibuka dari HP. Pencarian produknya juga cepat.", createdAt: daysAgo(1) },
  ];
  await prisma.appReview.createMany({ data: reviewSpecs });
  console.log(`  ${reviewSpecs.length} app reviews`);

  console.log("\nSeed selesai. Akun demo (password: seapedia123):");
  console.log("  admin  → Admin");
  console.log("  budi/rina/kurnia/sari → Seller");
  console.log("  citra  → Buyer");
  console.log("  rudi   → Driver");
  console.log("  andi   → Seller + Buyer");
  console.log("  dimas  → Buyer + Driver");
  console.log("  maya   → Buyer + Seller + Driver");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
