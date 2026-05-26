import sqlite3
conn = sqlite3.connect('/var/www/mindylu/backend/db_local.sqlite3')
cur = conn.cursor()
cur.execute('SELECT * FROM catalogo_cicloventa;')
print(cur.fetchall())
