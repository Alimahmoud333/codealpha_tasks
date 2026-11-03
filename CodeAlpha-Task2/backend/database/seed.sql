-- Sample catalog for the store. Generated once; edit freely.
-- Image files live in backend/public/products and are served at /assets/products/...

INSERT INTO categories (name) VALUES
  ('Bags'),
  ('Wallets'),
  ('Watches'),
  ('Jewellery'),
  ('Eyewear');

INSERT INTO products (category_id, name, description, price, stock, image_url) VALUES
  ((SELECT id FROM categories WHERE name = 'Bags'), 'Harbor Leather Tote', 'Full-grain vegetable-tanned leather tote with a suede-lined interior, an internal zip pocket and reinforced handles. Fits a 14-inch laptop.', 189.00, 14, '/assets/products/harbor-leather-tote.svg'),
  ((SELECT id FROM categories WHERE name = 'Bags'), 'Field Canvas Backpack', 'Waxed cotton canvas backpack with leather trim, a padded laptop sleeve and two side pockets. Water resistant and built for daily commuting.', 96.00, 22, '/assets/products/field-canvas-backpack.svg'),
  ((SELECT id FROM categories WHERE name = 'Bags'), 'Everyday Crossbody', 'Compact crossbody in pebbled leather with an adjustable strap, magnetic closure and a slim rear pocket that holds a phone.', 74.50, 3, '/assets/products/everyday-crossbody.svg'),
  ((SELECT id FROM categories WHERE name = 'Wallets'), 'Slim Bifold Wallet', 'Six card slots and a full-length note compartment in a bifold that stays under 8 mm thick. Edges are hand-painted and burnished.', 48.00, 40, '/assets/products/slim-bifold-wallet.svg'),
  ((SELECT id FROM categories WHERE name = 'Wallets'), 'Card Case, Saddle Tan', 'A minimal card holder with three pockets and a thumb cut-out. Vegetable-tanned leather that darkens gently with use.', 29.00, 55, '/assets/products/card-case-saddle-tan.svg'),
  ((SELECT id FROM categories WHERE name = 'Wallets'), 'Travel Document Holder', 'Holds a passport, boarding passes, cards and a pen. Soft leather lining and a snap closure keep everything flat in your bag.', 62.00, 0, '/assets/products/travel-document-holder.svg'),
  ((SELECT id FROM categories WHERE name = 'Watches'), 'Meridian Automatic 40mm', '40 mm stainless steel case with a self-winding movement, sapphire crystal and a display caseback. Water resistant to 50 m.', 345.00, 8, '/assets/products/meridian-automatic-40mm.svg'),
  ((SELECT id FROM categories WHERE name = 'Watches'), 'Field Quartz 36mm', 'A 36 mm field watch with a matte dial, luminous hands and a quartz movement. Comes on a canvas strap with quick-release pins.', 129.00, 17, '/assets/products/field-quartz-36mm.svg'),
  ((SELECT id FROM categories WHERE name = 'Jewellery'), 'Sterling Chain Bracelet', 'Solid 925 sterling silver curb chain, 19 cm with a lobster clasp and a 2 cm extender. Hypoallergenic and nickel free.', 85.00, 25, '/assets/products/sterling-chain-bracelet.svg'),
  ((SELECT id FROM categories WHERE name = 'Jewellery'), 'Signet Ring, Brushed Silver', 'A flat-top signet ring in recycled sterling silver with a brushed finish. Available to order in sizes 6 to 12.', 68.00, 30, '/assets/products/signet-ring-brushed-silver.svg'),
  ((SELECT id FROM categories WHERE name = 'Eyewear'), 'Cadiz Acetate Sunglasses', 'Hand-finished acetate frames with polarised UV400 lenses and five-barrel hinges. Supplied with a hard case and cloth.', 112.00, 19, '/assets/products/cadiz-acetate-sunglasses.svg'),
  ((SELECT id FROM categories WHERE name = 'Eyewear'), 'Aviator Sunglasses, Gold Frame', 'A classic teardrop aviator with a lightweight metal frame, adjustable nose pads and polarised green-grey lenses.', 138.00, 11, '/assets/products/aviator-sunglasses-gold.svg');
