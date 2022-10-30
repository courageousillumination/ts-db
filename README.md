# Architecture

Each kind of database has a folder in src.

## Relational

-   The `parser` folder contains the necessary logic to parse SQL statements. The main entry point is the `parse` function which takes in a string and returns an AST (see `parser/ast` for more details).
-   The `compiler` folder contains the necessary logic to compile the AST to byte code.
-   The `vm` folder contains the actual VM that will run the byte code.
