import pool from "../db.js";

/* POST /orders/checkout */
export async function checkout(req, res) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    /* 1. pegar cart_id + itens */
    const { rows: cartRows } = await client.query(
      "SELECT id FROM carts WHERE user_id = $1",
      [req.user.userId]
    );
    if (!cartRows[0]) return res.status(400).json({ error: "Carrinho vazio" });

    const cartId = cartRows[0].id;

    const { rows: items } = await client.query(
      `SELECT product_id, quantity, price
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       WHERE ci.cart_id = $1`,
      [cartId]
    );
    if (items.length === 0)
      return res.status(400).json({ error: "Carrinho vazio" });

    /* 2. calcular total */
    const total = items.reduce(
      (sum, it) => sum + Number(it.price) * it.quantity,
      0
    );

    /* 3. inserir ordem */
    const { rows: orderRows } = await client.query(
      `INSERT INTO orders (user_id, total, status)
       VALUES ($1,$2,'pending')
       RETURNING id, created_at`,
      [req.user.userId, total]
    );
    const orderId = orderRows[0].id;

    /* 4. copiar itens */
    const insertText = `INSERT INTO order_items
       (order_id, product_id, price_at_purchase, quantity)
       VALUES ($1,$2,$3,$4)`;
    for (const it of items) {
      await client.query(insertText, [
        orderId,
        it.product_id,
        it.price,
        it.quantity,
      ]);
    }

    /* 5. esvaziar carrinho */
    await client.query("DELETE FROM cart_items WHERE cart_id = $1", [cartId]);

    await client.query("COMMIT");
    res.status(201).json({
      orderId,
      total,
      created_at: orderRows[0].created_at,
      status: "pending",
    });
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(e);
    res.status(500).json({ error: "Erro no checkout" });
  } finally {
    client.release();
  }
}

/* GET /orders – lista do usuário logado */
export async function listOrders(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT id, total, status, created_at
       FROM orders
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.userId]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erro ao listar pedidos" });
  }
}
