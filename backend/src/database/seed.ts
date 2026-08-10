// ─── Seed Script ─────────────────────────────────────────────────────────────
// Run with: npm run seed
// Creates: admin user, 12 routes, 12 stops per route (placeholder coords),
//          12 chat rooms, admin added to all 12 rooms.
import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { join } from 'path';

dotenv.config();

const ROUTES = [
  { name: 'Route 1 - Porur',        nameTa: 'வழி 1 - போரூர்',        lat: 13.0389, lng: 80.1583 },
  { name: 'Route 2 - Tambaram',     nameTa: 'வழி 2 - தாம்பரம்',     lat: 12.9249, lng: 80.1000 },
  { name: 'Route 3 - Vadapalani',   nameTa: 'வழி 3 - வடபழனி',   lat: 13.0521, lng: 80.2121 },
  { name: 'Route 4 - Chromepet',    nameTa: 'வழி 4 - குரோம்பேட்',    lat: 12.9516, lng: 80.1462 },
  { name: 'Route 5 - Anna Nagar',   nameTa: 'வழி 5 - அண்ணா நகர்',   lat: 13.0850, lng: 80.2101 },
  { name: 'Route 6 - Velachery',    nameTa: 'வழி 6 - வேளச்சேரி',    lat: 12.9815, lng: 80.2209 },
  { name: 'Route 7 - Guindy',       nameTa: 'வழி 7 - கிண்டி',       lat: 13.0067, lng: 80.2206 },
  { name: 'Route 8 - Pallavaram',   nameTa: 'வழி 8 - பல்லாவரம்',   lat: 12.9675, lng: 80.1491 },
  { name: 'Route 9 - Perambur',     nameTa: 'வழி 9 - பெரம்பூர்',     lat: 13.1152, lng: 80.2436 },
  { name: 'Route 10 - Adyar',       nameTa: 'வழி 10 - அடையாறு',       lat: 13.0012, lng: 80.2565 },
  { name: 'Route 11 - Sholinganallur', nameTa: 'வழி 11 - சோழிங்கநல்லூர்', lat: 12.9010, lng: 80.2279 },
  { name: 'Route 12 - Avadi',       nameTa: 'வழி 12 - ஆவடி',       lat: 13.1128, lng: 80.0966 },
];

async function seed() {
  const ds = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'bustrack',
    username: process.env.DB_USER || 'bustrack_user',
    password: process.env.DB_PASSWORD || 'changeme',
    entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
    synchronize: false,
  });

  await ds.initialize();
  console.log('Connected to database.');

  const queryRunner = ds.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // 1. Admin user
    const adminEmail =
      process.env.ADMIN_EMAIL || 'admin@bustrack.vels.edu.in';
    const existing = await queryRunner.query(
      `SELECT id FROM users WHERE email = $1`,
      [adminEmail],
    );

    let adminId: string;
    if (existing.length === 0) {
      const hash = await bcrypt.hash(
        process.env.ADMIN_PASSWORD || 'changeme',
        12,
      );
      const [admin] = await queryRunner.query(
        `INSERT INTO users (email, password_hash, role, full_name)
         VALUES ($1, $2, 'admin', $3)
         RETURNING id`,
        [adminEmail, hash, process.env.ADMIN_FULL_NAME || 'System Administrator'],
      );
      adminId = admin.id;
      console.log(`Admin created: ${adminEmail}`);
    } else {
      adminId = existing[0].id;
      console.log(`Admin already exists: ${adminEmail}`);
    }

    // 2. Routes, chat rooms, and admin memberships
    for (const r of ROUTES) {
      const existingRoute = await queryRunner.query(
        `SELECT id FROM routes WHERE route_name = $1`,
        [r.name],
      );

      let routeId: string;
      if (existingRoute.length === 0) {
        const [route] = await queryRunner.query(
          `INSERT INTO routes (route_name, route_name_ta)
           VALUES ($1, $2) RETURNING id`,
          [r.name, r.nameTa],
        );
        routeId = route.id;

        // One placeholder stop per route (terminus)
        await queryRunner.query(
          `INSERT INTO stops (route_id, stop_name, sequence_num, latitude, longitude)
           VALUES ($1, $2, 1, $3, $4)`,
          [routeId, r.name + ' - Terminus', r.lat, r.lng],
        );
        console.log(`Route created: ${r.name}`);
      } else {
        routeId = existingRoute[0].id;
        console.log(`Route exists: ${r.name}`);
      }

      // Chat room for this route
      const existingRoom = await queryRunner.query(
        `SELECT id FROM chat_rooms WHERE route_id = $1`,
        [routeId],
      );

      let roomId: string;
      if (existingRoom.length === 0) {
        const [room] = await queryRunner.query(
          `INSERT INTO chat_rooms (route_id, room_name) VALUES ($1, $2) RETURNING id`,
          [routeId, r.name],
        );
        roomId = room.id;
        console.log(`  Chat room created for: ${r.name}`);
      } else {
        roomId = existingRoom[0].id;
      }

      // Add admin to this room (idempotent)
      const existingMember = await queryRunner.query(
        `SELECT id FROM chat_room_members WHERE room_id = $1 AND user_id = $2`,
        [roomId, adminId],
      );
      if (existingMember.length === 0) {
        await queryRunner.query(
          `INSERT INTO chat_room_members (room_id, user_id, role_in_room)
           VALUES ($1, $2, 'admin')`,
          [roomId, adminId],
        );
      }
    }

    await queryRunner.commitTransaction();
    console.log('Seed complete.');
  } catch (err) {
    await queryRunner.rollbackTransaction();
    console.error('Seed failed, transaction rolled back.', err);
    process.exit(1);
  } finally {
    await queryRunner.release();
    await ds.destroy();
  }
}

seed();
