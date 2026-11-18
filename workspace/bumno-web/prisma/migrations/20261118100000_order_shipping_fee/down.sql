-- Manual rollback for 20261118100000_order_shipping_fee (local / test databases only).
-- After running it, also remove the row from "_prisma_migrations":
--   DELETE FROM "_prisma_migrations" WHERE migration_name = '20261118100000_order_shipping_fee';
ALTER TABLE "Order" DROP COLUMN IF EXISTS "shippingFee";
