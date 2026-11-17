-- Manual rollback for 20261117100000_order_delivery_slot_index (local / test databases only).
-- After running it, also remove the row from "_prisma_migrations":
--   DELETE FROM "_prisma_migrations" WHERE migration_name = '20261117100000_order_delivery_slot_index';
DROP INDEX IF EXISTS "Order_deliverySlot_idx";
