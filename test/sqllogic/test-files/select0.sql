statement ok
CREATE TABLE t1(a INTEGER, b INTEGER, c INTEGER, d INTEGER, e INTEGER)

statement ok
INSERT INTO t1(e,c,b,d,a) VALUES(NULL,102,NULL,101,104)

statement ok
INSERT INTO t1(a,c,d,e,b) VALUES(107,106,108,109,105)

statement ok
INSERT INTO t1(e,d,b,a,c) VALUES(110,114,112,NULL,113)

statement ok
INSERT INTO t1(d,c,e,a,b) VALUES(116,119,117,115,NULL)

statement ok
INSERT INTO t1(c,d,b,e,a) VALUES(123,122,124,NULL,121)

statement ok
INSERT INTO t1(a,d,b,e,c) VALUES(127,128,129,126,125)

statement ok
INSERT INTO t1(e,c,a,d,b) VALUES(132,134,131,133,130)

statement ok
INSERT INTO t1(a,d,b,e,c) VALUES(138,136,139,135,137)

statement ok
INSERT INTO t1(e,c,d,a,b) VALUES(144,141,140,142,143)

statement ok
INSERT INTO t1(b,a,e,d,c) VALUES(145,149,146,NULL,147)

statement ok
INSERT INTO t1(b,c,a,d,e) VALUES(151,150,153,NULL,NULL)

statement ok
INSERT INTO t1(c,e,a,d,b) VALUES(155,157,159,NULL,158)

statement ok
INSERT INTO t1(c,b,a,d,e) VALUES(161,160,163,164,162)

statement ok
INSERT INTO t1(b,d,a,e,c) VALUES(167,NULL,168,165,166)

statement ok
INSERT INTO t1(d,b,c,e,a) VALUES(171,170,172,173,174)

statement ok
INSERT INTO t1(e,c,a,d,b) VALUES(177,176,179,NULL,175)

statement ok
INSERT INTO t1(b,e,a,d,c) VALUES(181,180,182,183,184)

statement ok
INSERT INTO t1(c,a,b,e,d) VALUES(187,188,186,189,185)

statement ok
INSERT INTO t1(d,b,c,e,a) VALUES(190,194,193,192,191)

statement ok
INSERT INTO t1(a,e,b,d,c) VALUES(199,197,198,196,195)

statement ok
INSERT INTO t1(b,c,d,a,e) VALUES(NULL,202,203,201,204)

statement ok
INSERT INTO t1(c,e,a,b,d) VALUES(208,NULL,NULL,206,207)

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
INSERT INTO t1(e,b,a,c,d) VALUES(237,236,239,NULL,238)

statement ok
INSERT INTO t1(e,c,b,a,d) VALUES(NULL,244,240,243,NULL)

statement ok
INSERT INTO t1(e,d,c,b,a) VALUES(246,248,247,249,245)


query IIIIII nosort
SELECT abs(a), a-b, CASE WHEN a<b-3 THEN 111 WHEN a<=b THEN 222 WHEN a<b+3 THEN 333 ELSE 444 END, (SELECT count(*) FROM t1 AS x WHERE x.b<t1.b), b-c, a+b*2+c*3+d*4+e*5, c FROM t1 ORDER BY 5,3
----
174 values hashing to 05379a2f92dfafe9d9f27b43b2da99a1
