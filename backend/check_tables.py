from db import get_conn

conn = get_conn()
cur = conn.cursor()
cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'rag'")
rows = cur.fetchall()
print("Tables in rag schema:", rows)
conn.close()
