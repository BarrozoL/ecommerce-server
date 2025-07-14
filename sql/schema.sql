CREATE TABLE IF NOT EXISTS users (
id SERIAL PRIMARY KEY,
username TEXT NOT NULL,
email TEXT UNIQUE NOT NULL,
password_hash TEXT NOT NULL,
role TEXT NOT NULL DEFAULT 'customer',
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS carts (
id SERIAL PRIMARY KEY,
user_id INT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
id SERIAL PRIMARY KEY,
name TEXT NOT NULL,
description TEXT,
image_url TEXT,
price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
stock INT DEFAULT 0,
category TEXT,
vendor_id INT REFERENCES users(id) ON DELETE SET NULL,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_vendor ON products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

CREATE TABLE IF NOT EXISTS cart_items (
cart_id INT REFERENCES carts(id) ON DELETE CASCADE,
product_id INT REFERENCES products(id) ON DELETE CASCADE,
quantity INT NOT NULL CHECK (quantity > 0),
PRIMARY KEY (cart_id, product_id)
);

CREATE TABLE IF NOT EXISTS orders (
id SERIAL PRIMARY KEY,
user_id INT REFERENCES users(id),
total NUMERIC(10,2),
status TEXT DEFAULT 'pending',
stripe_session_id TEXT,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);

CREATE TABLE IF NOT EXISTS order_items (
order_id INT REFERENCES orders(id) ON DELETE CASCADE,
product_id INT REFERENCES products(id),
price_at_purchase NUMERIC(10,2) NOT NULL,
quantity INT NOT NULL CHECK (quantity > 0),
PRIMARY KEY (order_id, product_id)
)