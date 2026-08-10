import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1000000000000 implements MigrationInterface {
  name = 'InitialSchema1000000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── users ──────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "email"         TEXT NOT NULL UNIQUE,
        "password_hash" TEXT NOT NULL,
        "role"          TEXT NOT NULL CHECK (role IN ('student', 'driver', 'admin')),
        "full_name"     TEXT NOT NULL,
        "phone"         TEXT,
        "language_pref" TEXT NOT NULL DEFAULT 'en' CHECK (language_pref IN ('en', 'ta')),
        "theme_pref"    TEXT NOT NULL DEFAULT 'light' CHECK (theme_pref IN ('light', 'dark')),
        "fcm_token"     TEXT,
        "is_active"     BOOLEAN NOT NULL DEFAULT TRUE,
        "created_at"    TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at"    TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // ── buses ──────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "buses" (
        "id"           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "bus_number"   TEXT NOT NULL UNIQUE,
        "plate_number" TEXT NOT NULL UNIQUE,
        "capacity"     INTEGER NOT NULL DEFAULT 60,
        "is_active"    BOOLEAN NOT NULL DEFAULT TRUE,
        "created_at"   TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at"   TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // ── routes ─────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "routes" (
        "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "route_name"    TEXT NOT NULL UNIQUE,
        "route_name_ta" TEXT,
        "description"   TEXT,
        "is_active"     BOOLEAN NOT NULL DEFAULT TRUE,
        "created_at"    TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at"    TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // ── stops ──────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "stops" (
        "id"             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "route_id"       UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
        "stop_name"      TEXT NOT NULL,
        "stop_name_ta"   TEXT,
        "sequence_num"   INTEGER NOT NULL,
        "latitude"       DOUBLE PRECISION NOT NULL,
        "longitude"      DOUBLE PRECISION NOT NULL,
        "scheduled_time" TIME,
        "created_at"     TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at"     TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (route_id, sequence_num)
      )
    `);

    // ── bus_assignments ────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "bus_assignments" (
        "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "bus_id"      UUID NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
        "route_id"    UUID NOT NULL REFERENCES routes(id) ON DELETE RESTRICT,
        "driver_id"   UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        "assigned_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "is_current"  BOOLEAN NOT NULL DEFAULT TRUE,
        "created_at"  TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // Enforce: only one active assignment per bus
    await queryRunner.query(`
      CREATE UNIQUE INDEX "one_active_assignment_per_bus_idx"
        ON bus_assignments (bus_id)
        WHERE is_current = TRUE
    `);

    // ── chat_rooms ─────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "chat_rooms" (
        "id"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "route_id"   UUID NOT NULL UNIQUE REFERENCES routes(id) ON DELETE RESTRICT,
        "room_name"  TEXT NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // ── chat_room_members ──────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "chat_room_members" (
        "id"           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "room_id"      UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
        "user_id"      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "role_in_room" TEXT NOT NULL CHECK (role_in_room IN ('student', 'driver', 'admin')),
        "added_at"     TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (room_id, user_id)
      )
    `);

    // Enforce: a student belongs to exactly one chat room
    await queryRunner.query(`
      CREATE UNIQUE INDEX "one_room_per_student_idx"
        ON chat_room_members (user_id)
        WHERE role_in_room = 'student'
    `);

    // ── rides ──────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "rides" (
        "id"                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "bus_id"                  UUID NOT NULL REFERENCES buses(id) ON DELETE RESTRICT,
        "driver_id"               UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        "route_id"                UUID NOT NULL REFERENCES routes(id) ON DELETE RESTRICT,
        "status"                  TEXT NOT NULL DEFAULT 'not_started'
                                    CHECK (status IN ('not_started','active','destination_reached','ended')),
        "started_at"              TIMESTAMPTZ,
        "destination_reached_at"  TIMESTAMPTZ,
        "ended_at"                TIMESTAMPTZ,
        "created_at"              TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // Enforce: at most one active ride per bus
    await queryRunner.query(`
      CREATE UNIQUE INDEX "one_active_ride_per_bus_idx"
        ON rides (bus_id)
        WHERE status IN ('active', 'destination_reached')
    `);

    await queryRunner.query(`CREATE INDEX "rides_status_idx" ON rides (status)`);

    // ── gps_pings ──────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "gps_pings" (
        "id"          BIGSERIAL PRIMARY KEY,
        "ride_id"     UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
        "bus_id"      UUID NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
        "latitude"    DOUBLE PRECISION NOT NULL,
        "longitude"   DOUBLE PRECISION NOT NULL,
        "speed_kmh"   REAL,
        "heading"     REAL,
        "accuracy_m"  REAL,
        "recorded_at" TIMESTAMPTZ NOT NULL,
        "received_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "gps_pings_ride_idx" ON gps_pings (ride_id, recorded_at DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX "gps_pings_bus_idx"  ON gps_pings (bus_id, recorded_at DESC)`,
    );

    // ── messages ───────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "messages" (
        "id"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "room_id"    UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
        "sender_id"  UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        "content"    TEXT,
        "is_deleted" BOOLEAN NOT NULL DEFAULT FALSE,
        "deleted_by" UUID REFERENCES users(id),
        "deleted_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "messages_room_idx" ON messages (room_id, created_at DESC)`,
    );

    // ── attachments ────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "attachments" (
        "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "message_id"      UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
        "uploader_id"     UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        "room_id"         UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
        "storage_key"     TEXT NOT NULL UNIQUE,
        "file_name"       TEXT NOT NULL,
        "mime_type"       TEXT NOT NULL,
        "file_size_bytes" BIGINT NOT NULL,
        "uploaded_at"     TIMESTAMPTZ NOT NULL DEFAULT now(),
        "expires_at"      TIMESTAMPTZ NOT NULL,
        "is_purged"       BOOLEAN NOT NULL DEFAULT FALSE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "attachments_expires_idx" ON attachments (expires_at) WHERE is_purged = FALSE`,
    );

    // ── notifications_log ──────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "notifications_log" (
        "id"             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "recipient_id"   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "trigger_event"  TEXT NOT NULL,
        "title"          TEXT NOT NULL,
        "body"           TEXT NOT NULL,
        "sent_at"        TIMESTAMPTZ NOT NULL DEFAULT now(),
        "fcm_message_id" TEXT,
        "status"         TEXT NOT NULL CHECK (status IN ('sent', 'failed'))
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "notif_log_recipient_idx" ON notifications_log (recipient_id, sent_at DESC)`,
    );

    // ── audit_log ──────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "audit_log" (
        "id"          BIGSERIAL PRIMARY KEY,
        "actor_id"    UUID,
        "actor_role"  TEXT,
        "action"      TEXT NOT NULL,
        "target_type" TEXT,
        "target_id"   TEXT,
        "metadata"    JSONB,
        "ip_address"  INET,
        "created_at"  TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "audit_log_created_idx" ON audit_log (created_at DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX "audit_log_actor_idx" ON audit_log (actor_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX "audit_log_action_idx" ON audit_log (action)`,
    );

    // ── refresh_tokens ─────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id"           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id"      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "token_hash"   TEXT NOT NULL UNIQUE,
        "expires_at"   TIMESTAMPTZ NOT NULL,
        "revoked"      BOOLEAN NOT NULL DEFAULT FALSE,
        "issued_at"    TIMESTAMPTZ NOT NULL DEFAULT now(),
        "last_used_at" TIMESTAMPTZ
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "refresh_tokens_user_idx" ON refresh_tokens (user_id) WHERE revoked = FALSE`,
    );

    // ── scheduled_job_log ──────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "scheduled_job_log" (
        "id"            BIGSERIAL PRIMARY KEY,
        "job_name"      TEXT NOT NULL,
        "started_at"    TIMESTAMPTZ NOT NULL DEFAULT now(),
        "finished_at"   TIMESTAMPTZ,
        "status"        TEXT NOT NULL DEFAULT 'running',
        "rows_affected" INTEGER,
        "error_message" TEXT
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS scheduled_job_log CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS refresh_tokens CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS audit_log CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS notifications_log CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS attachments CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS messages CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS gps_pings CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS rides CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS chat_room_members CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS chat_rooms CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS bus_assignments CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS stops CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS routes CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS buses CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS users CASCADE`);
  }
}
