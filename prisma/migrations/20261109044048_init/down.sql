-- Manual rollback for 20261109044048_init (local / test databases only).
-- After running it, also remove the row from "_prisma_migrations":
--   DELETE FROM "_prisma_migrations" WHERE migration_name = '20261109044048_init';
DROP TABLE IF EXISTS "OrderItem";
DROP TABLE IF EXISTS "Order";
DROP TYPE IF EXISTS "OrderStatus";
