import "dotenv/config";
import { Pool } from 'pg'

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

const connectDB = async () => {
    try {
        const client = await pool.connect();
        client.release();
    } catch (err) {
        console.error('failed to connect', err)
    }
}

export default connectDB;