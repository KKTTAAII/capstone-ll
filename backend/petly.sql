\echo 'Delete and recreate petly db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE petly;
CREATE DATABASE petly;
\connect petly

\i petly-schema.sql
\i petly-seed.sql

\echo 'Delete and recreate petly_test db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE petly_test;
CREATE DATABASE petly_test;
\connect petly_test

\i petly-schema.sql

