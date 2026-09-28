"""Depot data access for the TN Transit Flask backend."""

import os
import psycopg


def pg_connection():
    return psycopg.connect(
        host=os.getenv("PGHOST", "127.0.0.1"),
        port=os.getenv("PGPORT", "5432"),
        dbname=os.getenv("PGDATABASE", "TestDb"),
        user=os.getenv("PGUSER", "fdstest"),
        password=os.getenv("PGPASSWORD", ""),
    )


def find_depots(query="", district="", corporation=""):
    query = query.strip().lower()
    district = district.strip()
    corporation = corporation.strip()

    conn = pg_connection()

    try:
        with conn.cursor() as cur:
            sql = """
                SELECT
                    id,
                    name,
                    city,
                    district,
                    corp,
                    fleet,
                    status,
                    phone
                FROM bus_depots
                WHERE
                    (%s = '' OR
                     LOWER(name) LIKE %s OR
                     LOWER(city) LIKE %s OR
                     LOWER(district) LIKE %s OR
                     LOWER(corp) LIKE %s OR
                     LOWER(status) LIKE %s)
                    AND (%s = '' OR district = %s)
                    AND (%s = '' OR corp = %s)
                ORDER BY id
            """

            search_pattern = f"%{query}%"

            cur.execute(
                sql,
                (
                    query,
                    search_pattern,
                    search_pattern,
                    search_pattern,
                    search_pattern,
                    search_pattern,
                    district,
                    district,
                    corporation,
                    corporation,
                ),
            )

            rows = cur.fetchall()

            columns = [
                "id",
                "name",
                "city",
                "district",
                "corp",
                "fleet",
                "status",
                "phone",
            ]

            return [dict(zip(columns, row)) for row in rows]

    finally:
        conn.close()


def find_depot(depot_id):
    conn = pg_connection()

    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT
                    id,
                    name,
                    city,
                    district,
                    corp,
                    fleet,
                    status,
                    phone
                FROM bus_depots
                WHERE id = %s
            """, (depot_id,))

            row = cur.fetchone()
            if row is None:
                return None

            columns = [
                "id",
                "name",
                "city",
                "district",
                "corp",
                "fleet",
                "status",
                "phone",
            ]

            return dict(zip(columns, row))

    finally:
        conn.close()


def get_stats():
    conn = pg_connection()

    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT
                    COUNT(*) AS active_depots,
                    COALESCE(SUM(fleet), 0) AS buses,
                    COUNT(DISTINCT district) AS districts
                FROM bus_depots
            """)

            row = cur.fetchone()

            return {
                "activeDepots": row[0],
                "buses": row[1],
                "districts": row[2],
                "chargingPoints": 142,
            }

    finally:
        conn.close()