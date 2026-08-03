import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { buildPakasirPaymentUrl } from "@/lib/pakasir";

const schema = z.object({
  items: z.array(z.object({ product_id: z.string().uuid(), quantity: z.number().int().min(1).max(99) })).min(1),
  voucherCode: z.string().trim().optional(),
  useCoin: z.boolean().optional(),
  address: z
    .object({
      recipient_name: z.string().min(1),
      phone: z.string().min(6),
      province: z.string().min(1),
      city: z.string().min(1),
      district: z.string().min(1),
      postal_code: z.string().min(1),
      full_address: z.string().min(1),
      notes: z.string().optional(),
    })
    .optional(),
});

export async function POST(req: Request) {
  const session = await createClient();
  const {
    data: { user },
  } = await session.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Silakan masuk terlebih dahulu" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Data pesanan tidak valid" }, { status: 400 });
  }
  const { items, voucherCode, useCoin, address } = parsed.data;

  const admin = createAdminClient();

  const productIds = items.map((i) => i.product_id);
  const { data: products, error: productsError } = await admin
    .from("products")
    .select("id, name, type, price, discount_percent, stock, category_id, download_limit_days, status")
    .in("id", productIds);

  if (productsError || !products || products.length !== productIds.length) {
    return NextResponse.json({ error: "Ada produk yang tidak valid atau sudah dihapus" }, { status: 400 });
  }

  const hasPhysical = products.some((p) => p.type === "physical");
  if (hasPhysical && !address) {
    return NextResponse.json({ error: "Alamat pengiriman wajib diisi" }, { status: 400 });
  }

  for (const item of items) {
    const product = products.find((p) => p.id === item.product_id)!;
    if (product.status !== "published") {
      return NextResponse.json({ error: `${product.name} sedang tidak tersedia` }, { status: 400 });
    }
    if (product.type === "physical" && (product.stock ?? 0) < item.quantity) {
      return NextResponse.json({ error: `Stok ${product.name} tidak cukup` }, { status: 400 });
    }
  }

  const orderItemsPayload = items.map((item) => {
    const product = products.find((p) => p.id === item.product_id)!;
    const unitPrice =
      product.discount_percent > 0
        ? Math.round(product.price * (1 - product.discount_percent / 100))
        : product.price;
    return {
      product_id: product.id,
      product_name: product.name,
      product_type: product.type,
      unit_price: unitPrice,
      quantity: item.quantity,
      subtotal: unitPrice * item.quantity,
    };
  });

  const subtotal = orderItemsPayload.reduce((sum, i) => sum + i.subtotal, 0);

  let discountAmount = 0;
  let voucherId: string | null = null;
  if (voucherCode) {
    const { data: voucher } = await admin
      .from("vouchers")
      .select("*")
      .eq("code", voucherCode.toUpperCase())
      .eq("is_active", true)
      .maybeSingle();

    if (!voucher) {
      return NextResponse.json({ error: "Voucher tidak ditemukan atau tidak aktif" }, { status: 400 });
    }
    const now = Date.now();
    if (voucher.starts_at && new Date(voucher.starts_at).getTime() > now) {
      return NextResponse.json({ error: "Voucher belum berlaku" }, { status: 400 });
    }
    if (voucher.ends_at && new Date(voucher.ends_at).getTime() < now) {
      return NextResponse.json({ error: "Voucher sudah kedaluwarsa" }, { status: 400 });
    }
    if (voucher.quota !== null && voucher.used_count >= voucher.quota) {
      return NextResponse.json({ error: "Kuota voucher habis" }, { status: 400 });
    }
    if (subtotal < voucher.min_purchase) {
      return NextResponse.json({ error: "Belum memenuhi minimal pembelian voucher" }, { status: 400 });
    }
    if (voucher.scope === "category" && voucher.category_id) {
      const eligible = products.some((p) => p.category_id === voucher.category_id);
      if (!eligible) {
        return NextResponse.json({ error: "Voucher tidak berlaku untuk produk ini" }, { status: 400 });
      }
    }
    if (voucher.scope === "product" && voucher.product_id) {
      const eligible = items.some((i) => i.product_id === voucher.product_id);
      if (!eligible) {
        return NextResponse.json({ error: "Voucher tidak berlaku untuk produk ini" }, { status: 400 });
      }
    }

    discountAmount =
      voucher.discount_type === "percentage"
        ? Math.round(subtotal * (Number(voucher.discount_value) / 100))
        : Math.min(Number(voucher.discount_value), subtotal);
    voucherId = voucher.id;
  }

  let coinUsed = 0;
  const { data: profile } = await admin.from("profiles").select("coin").eq("id", user.id).maybeSingle();

  if (useCoin && profile && profile.coin > 0) {
    const { data: coinSettings } = await admin.from("coin_settings").select("*").eq("id", 1).maybeSingle();
    const rate = coinSettings ? Number(coinSettings.coin_to_idr_rate) : 1;
    const maxCoinValue = Math.max(subtotal - discountAmount, 0);
    const maxCoinUsable = Math.floor(maxCoinValue / rate);
    coinUsed = Math.min(profile.coin, maxCoinUsable);
  }

  const total = Math.max(subtotal - discountAmount - coinUsed, 0);

  let addressId: string | null = null;
  if (address) {
    const { data: addr, error: addrError } = await admin
      .from("addresses")
      .insert({ ...address, user_id: user.id })
      .select("id")
      .single();
    if (addrError) {
      return NextResponse.json({ error: "Gagal menyimpan alamat" }, { status: 500 });
    }
    addressId = addr.id;
  }

  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      user_id: user.id,
      subtotal,
      discount_amount: discountAmount,
      coin_used: coinUsed,
      total,
      voucher_id: voucherId,
      address_id: addressId,
    })
    .select("id, order_number, total")
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: "Gagal membuat pesanan" }, { status: 500 });
  }

  const { error: itemsError } = await admin
    .from("order_items")
    .insert(orderItemsPayload.map((i) => ({ ...i, order_id: order.id })));

  if (itemsError) {
    return NextResponse.json({ error: "Gagal menyimpan detail pesanan" }, { status: 500 });
  }

  if (order.total === 0) {
    await admin
      .from("orders")
      .update({ status: "paid", payment_status: "success", paid_at: new Date().toISOString() })
      .eq("id", order.id);
    return NextResponse.json({ orderNumber: order.order_number, paymentUrl: null, free: true });
  }

  const paymentUrl = buildPakasirPaymentUrl({
    orderId: order.order_number,
    amount: order.total,
    redirectUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/pesanan/${order.order_number}`,
  });

  return NextResponse.json({ orderNumber: order.order_number, paymentUrl });
}
