-- Runs once when the Postgres container is first initialised, giving the
-- integration tests their own database so they never touch dev data.
CREATE DATABASE tickets_test;
