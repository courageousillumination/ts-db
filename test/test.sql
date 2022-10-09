CREATE TABLE testTable (column1 INTEGER, column2 INTEGER);
INSERT INTO testTable VALUES (0, 5);
INSERT INTO testTable VALUES (2, 5);
INSERT INTO testTable VALUES (1, 5);
SELECT column1 FROM testTable ORDER BY column1;