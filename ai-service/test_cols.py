import sys
sys.stdout.reconfigure(encoding='utf-8')
import mysql.connector
from dotenv import load_dotenv
import os
from pathlib import Path

load_dotenv(dotenv_path=Path(__file__).parent / ".env", override=True)

conn = mysql.connector.connect(
    host=os.getenv("DB_HOST","localhost"),
    port=int(os.getenv("DB_PORT","3306")),
    user=os.getenv("DB_USER","root"),
    password=os.getenv("DB_PASSWORD",""),
    database=os.getenv("DB_NAME","he_thong_ban_hang_ai"),
    charset="utf8mb4", use_unicode=True,
)
cur = conn.cursor()
cur.execute("DESCRIBE san_pham")
cols = cur.fetchall()
print("=== SAN_PHAM TABLE COLUMNS ===")
for c in cols:
    print(f"  {c[0]} | {c[1]}")
conn.close()
