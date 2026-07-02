import { z } from "zod";

/** Roles a user may self-assign at registration. Admin is seed-only. */
export const selfAssignableRoles = ["BUYER", "SELLER", "DRIVER"] as const;

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Username minimal 3 karakter")
    .max(20, "Username maksimal 20 karakter")
    .regex(/^[a-z0-9_]+$/i, "Username hanya boleh huruf, angka, dan underscore"),
  name: z.string().min(2, "Nama minimal 2 karakter").max(60, "Nama maksimal 60 karakter"),
  email: z.string().email("Format email tidak valid").max(120),
  phone: z
    .string()
    .regex(/^(\+62|62|0)8\d{7,11}$/, "Format nomor HP tidak valid (contoh: 081234567890)")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  password: z.string().min(8, "Password minimal 8 karakter").max(100),
  roles: z
    .array(z.enum(selfAssignableRoles))
    .min(1, "Pilih minimal satu peran")
    .max(3),
});

export const loginSchema = z.object({
  identifier: z.string().min(1, "Username atau email wajib diisi").max(120),
  password: z.string().min(1, "Password wajib diisi").max(100),
});

export const activeRoleSchema = z.object({
  role: z.enum(["ADMIN", "SELLER", "BUYER", "DRIVER"]),
});

export const storeSchema = z.object({
  name: z
    .string()
    .min(3, "Nama toko minimal 3 karakter")
    .max(40, "Nama toko maksimal 40 karakter"),
  description: z.string().max(300, "Deskripsi maksimal 300 karakter").optional(),
  city: z.string().max(40, "Nama kota maksimal 40 karakter").optional(),
});

export const productSchema = z.object({
  name: z
    .string()
    .min(3, "Nama produk minimal 3 karakter")
    .max(80, "Nama produk maksimal 80 karakter"),
  description: z
    .string()
    .min(10, "Deskripsi minimal 10 karakter")
    .max(2000, "Deskripsi maksimal 2000 karakter"),
  price: z.coerce
    .number()
    .int("Harga harus bilangan bulat rupiah")
    .min(500, "Harga minimal Rp500")
    .max(1_000_000_000, "Harga maksimal Rp1.000.000.000"),
  stock: z.coerce
    .number()
    .int("Stok harus bilangan bulat")
    .min(0, "Stok tidak boleh negatif")
    .max(1_000_000, "Stok terlalu besar"),
  imageUrl: z
    .string()
    .url("URL gambar tidak valid")
    .startsWith("https://", "Gunakan URL https")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  category: z.string().max(40).optional().or(z.literal("").transform(() => undefined)),
});

export const reviewSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(60, "Nama maksimal 60 karakter"),
  rating: z.coerce
    .number()
    .int("Rating harus bilangan bulat")
    .min(1, "Rating minimal 1")
    .max(5, "Rating maksimal 5"),
  comment: z
    .string()
    .min(5, "Komentar minimal 5 karakter")
    .max(500, "Komentar maksimal 500 karakter"),
});
