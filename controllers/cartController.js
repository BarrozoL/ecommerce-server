import pool from "../db.js";

async function getOrCreateCart(userId) {
  // 1ª tentativa – já existe?
  let { rows } = await pool.query("SELECT id FROM carts WHERE user_id = $1", [
    userId,
  ]);
  if (rows[0]) return rows[0].id;

  // 2ª – cria (ou pega se conflitar)
  ({ rows } = await pool.query(
    `INSERT INTO carts (user_id)
     VALUES ($1)
     ON CONFLICT (user_id)
     DO UPDATE SET user_id = EXCLUDED.user_id
     RETURNING id`,
    [userId]
  ));
  return rows[0].id;
}

//POST cart/items

export async function addItem(req, res) {
  const { productId, quantity } = req.body;
  if (!productId || !quantity || quantity < 1)
    return res
      .status(400)
      .json({ error: "productId and quantity must be greater than 0" });

  try {
    const cartId = await getOrCreateCart(req.user.userId);

    await pool.query(
      `INSERT INTO cart_items (cart_id, product_id, quantity)
       VALUES ($1,$2,$3)
       ON CONFLICT (cart_id, product_id)
       DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity`,
      [cartId, productId, quantity]
    );
    res.status(201).json({ message: "Item added/updated successfully" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
}

/* GET /cart  → itens + subtotal */
export async function getCart(req, res) {
  try {
    const { rows: c } = await pool.query(
      "SELECT id FROM carts WHERE user_id = $1",
      [req.user.userId]
    );
    if (!c[0]) return res.json({ items: [] });

    const cartId = c[0].id;
    const { rows } = await pool.query(
      `SELECT p.id, p.name, p.price, ci.quantity,
              (p.price * ci.quantity) AS subtotal
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       WHERE ci.cart_id = $1`,
      [cartId]
    );
    res.json({ items: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
}

/* DELETE /cart/items/:productId */
export async function removeItem(req, res) {
  const { productId } = req.params;
  try {
    const { rows: c } = await pool.query(
      "SELECT id FROM carts WHERE user_id = $1",
      [req.user.userId]
    );
    if (!c[0]) return res.status(404).json({ error: "Empty cart" });

    await pool.query(
      "DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2",
      [c[0].id, productId]
    );
    res.json({ message: "Item removido" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
}
