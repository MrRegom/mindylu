import sqlite3
c = sqlite3.connect('C:/proyectos/mindylu/backend/db_local.sqlite3')
try:
    print(c.execute('SELECT count(*) FROM catalogo_prenda').fetchone())
except Exception as e:
    print(e)
