const express = require("express");
const cors = require("cors");
const path = require("path");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
    host: process.env.PGHOST,
    port: Number(process.env.PGPORT),
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD
});

// Serve your website
app.use(express.static(__dirname));

// Test PostgreSQL connection
app.get("/api/test-db", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");

        res.json({
            success: true,
            message: "PostgreSQL connected successfully",
            time: result.rows[0].now
        });
    } catch (error) {
        console.error("PostgreSQL error:", error.message);

        res.status(500).json({
            success: false,
            message: "PostgreSQL connection failed",
            error: error.message
        });
    }
});

// Get all bus depots
app.get("/api/depots", async (req, res) => {
    try {
        const result = await pool.query(`
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
            ORDER BY id
        `);

        res.json(result.rows);

    } catch (error) {
        console.error("Depot query error:", error.message);

        res.status(500).json({
            error: "Unable to get depot data"
        });
    }
});

// Get website statistics
app.get("/api/stats", async (req, res) => {
    try {

        const depotResult = await pool.query(`
            SELECT COUNT(*) AS total_depots
            FROM bus_depots
        `);

        const busResult = await pool.query(`
            SELECT COALESCE(SUM(fleet), 0) AS total_buses
            FROM bus_depots
        `);

        const districtResult = await pool.query(`
            SELECT COUNT(DISTINCT district) AS total_districts
            FROM bus_depots
        `);

        res.json({
            activeDepots: Number(depotResult.rows[0].total_depots),
            buses: Number(busResult.rows[0].total_buses),
            districts: Number(districtResult.rows[0].total_districts),
            chargingPoints: 142
        });

    } catch (error) {
        console.error("Stats query error:", error.message);

        res.status(500).json({
            error: "Unable to get statistics"
        });
    }
});

// Start server
const PORT = Number(process.env.PORT) || 5000;

app.listen(PORT, () => {
    console.log(`TN Transit website running at http://localhost:${PORT}`);
});

// Get one depot for the detail screen
app.get("/api/depots/:id", async (req, res) => {
    try {
        const result = await pool.query(`
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
            WHERE id = $1
        `, [req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Depot not found" });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error("Depot detail query error:", error.message);
        res.status(500).json({ error: "Unable to get depot details" });
    }
});