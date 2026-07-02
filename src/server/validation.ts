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
