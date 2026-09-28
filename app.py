"""Flask backend for the TN Transit depot directory."""

import os
from pathlib import Path

from flask import Flask, jsonify, send_from_directory, request

from database import find_depot, find_depots, get_stats

BASE_DIR = Path(__file__).resolve().parent
app = Flask(__name__)


@app.get("/")
def home():
    return send_from_directory(BASE_DIR, "index.html")


@app.get("/<path:filename>")
def frontend_file(filename):
    return send_from_directory(BASE_DIR, filename)


@app.get("/api/depots")
def depots():
    return jsonify(
        find_depots(
            query=request.args.get("q", ""),
            district=request.args.get("district", ""),
            corporation=request.args.get("corp", ""),
        )
    )


@app.get("/api/depots/<int:depot_id>")
def depot_details(depot_id):
    depot = find_depot(depot_id)
    if depot is None:
        return jsonify({"error": "Depot not found"}), 404
    return jsonify(depot)


@app.get("/api/stats")
def stats():
    return jsonify(get_stats())


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "5000")), debug=True)
