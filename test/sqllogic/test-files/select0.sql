statement ok
CREATE TABLE t1(a INTEGER, b INTEGER, c INTEGER, d INTEGER, e INTEGER)

statement ok
INSERT INTO t1(e,c,b,d,a) VALUES(103,102,100,101,104)

statement ok
INSERT INTO t1(a,c,d,e,b) VALUES(107,106,108,109,105)

statement ok
INSERT INTO t1(e,d,b,a,c) VALUES(110,114,112,111,113)

statement ok
INSERT INTO t1(d,c,e,a,b) VALUES(116,119,117,115,118)

statement ok
INSERT INTO t1(c,d,b,e,a) VALUES(123,122,124,120,121)

statement ok
INSERT INTO t1(a,d,b,e,c) VALUES(127,128,129,126,125)

statement ok
INSERT INTO t1(e,c,a,d,b) VALUES(132,134,131,133,130)

statement ok
INSERT INTO t1(a,d,b,e,c) VALUES(138,136,139,135,137)

statement ok
INSERT INTO t1(e,c,d,a,b) VALUES(144,141,140,142,143)

statement ok
INSERT INTO t1(b,a,e,d,c) VALUES(145,149,146,148,147)

statement ok
INSERT INTO t1(b,c,a,d,e) VALUES(151,150,153,154,152)

statement ok
INSERT INTO t1(c,e,a,d,b) VALUES(155,157,159,156,158)

statement ok
INSERT INTO t1(c,b,a,d,e) VALUES(161,160,163,164,162)

statement ok
INSERT INTO t1(b,d,a,e,c) VALUES(167,169,168,165,166)

statement ok
INSERT INTO t1(d,b,c,e,a) VALUES(171,170,172,173,174)

statement ok
INSERT INTO t1(e,c,a,d,b) VALUES(177,176,179,178,175)

statement ok
INSERT INTO t1(b,e,a,d,c) VALUES(181,180,182,183,184)

statement ok
INSERT INTO t1(c,a,b,e,d) VALUES(187,188,186,189,185)

statement ok
INSERT INTO t1(d,b,c,e,a) VALUES(190,194,193,192,191)

statement ok
INSERT INTO t1(a,e,b,d,c) VALUES(199,197,198,196,195)

statement ok
INSERT INTO t1(b,c,d,a,e) VALUES(200,202,203,201,204)

statement ok
INSERT INTO t1(c,e,a,b,d) VALUES(208,209,205,206,207)

statement ok
INSERT INTO t1(c,e,a,d,b) VALUES(214,210,213,212,211)

statement ok
INSERT INTO t1(b,c,a,d,e) VALUES(218,215,216,217,219)

statement ok
INSERT INTO t1(b,e,d,a,c) VALUES(223,221,222,220,224)

statement ok
INSERT INTO t1(d,e,b,a,c) VALUES(226,227,228,229,225)

statement ok
INSERT INTO t1(a,c,b,e,d) VALUES(234,231,232,230,233)

statement ok
INSERT INTO t1(e,b,a,c,d) VALUES(237,236,239,235,238)

statement ok
INSERT INTO t1(e,c,b,a,d) VALUES(242,244,240,243,241)

statement ok
INSERT INTO t1(e,d,c,b,a) VALUES(246,248,247,249,245)

query I nosort
SELECT CASE WHEN c>(SELECT avg(c) FROM t1) THEN a*2 ELSE b*10 END
  FROM t1
 ORDER BY 1
----
30 values hashing to 3c13dee48d9356ae19af2515e05e6b54