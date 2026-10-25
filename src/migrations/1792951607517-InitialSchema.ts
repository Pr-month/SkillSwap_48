import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1792951607517 implements MigrationInterface {
  name = 'InitialSchema1792951607517';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."users_gender_enum" AS ENUM('MALE', 'FEMALE', 'OTHER')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('USER', 'ADMIN')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "email" character varying(254) NOT NULL, "password" character varying(255) NOT NULL, "about" text NOT NULL, "birthdate" date NOT NULL, "city" character varying(100) NOT NULL, "gender" "public"."users_gender_enum" NOT NULL, "avatar" text NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'USER', "refreshToken" text, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "skills" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(150) NOT NULL, "description" text NOT NULL, "images" text array NOT NULL DEFAULT '{}', "category_id" uuid NOT NULL, "owner_id" uuid, CONSTRAINT "PK_0d3212120f4ecedf90864d7e298" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "parent_id" uuid, CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "cities" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "district" character varying(100), "subject" character varying(100), "lat" numeric(10,6), "lon" numeric(10,6), "population" integer, CONSTRAINT "PK_4762ffb6e5d198cfec5606bc11e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."requests_status_enum" AS ENUM('pending', 'accepted', 'rejected', 'inProgress', 'done')`,
    );
    await queryRunner.query(
      `CREATE TABLE "requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "status" "public"."requests_status_enum" NOT NULL DEFAULT 'pending', "is_read" boolean NOT NULL DEFAULT false, "sender_id" uuid NOT NULL, "receiver_id" uuid NOT NULL, "offered_skill_id" uuid NOT NULL, "requested_skill_id" uuid NOT NULL, CONSTRAINT "PK_0428f484e96f9e6a55955f29b5f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_want_to_learn" ("user_id" uuid NOT NULL, "category_id" uuid NOT NULL, CONSTRAINT "PK_8d71706bfd4afa322e0635bdda0" PRIMARY KEY ("user_id", "category_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4fccf7f0785066b7024ca149c5" ON "user_want_to_learn"  ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d9682d87dc26e31e3e6a970831" ON "user_want_to_learn"  ("category_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "user_favorite_skills" ("user_id" uuid NOT NULL, "skill_id" uuid NOT NULL, CONSTRAINT "PK_17b8886306b99feaf1a8e7cc4d1" PRIMARY KEY ("user_id", "skill_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_de3d937d00b6933e38788aa50e" ON "user_favorite_skills"  ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b7729ebbfb24496e67528df573" ON "user_favorite_skills"  ("skill_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "skills" ADD CONSTRAINT "FK_47dd0ade7ed449a7aca9b9e6752" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "skills" ADD CONSTRAINT "FK_7f2277da303cf72a0b941a84689" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" ADD CONSTRAINT "FK_88cea2dc9c31951d06437879b40" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "requests" ADD CONSTRAINT "FK_7e58368e50d76813c1aca1eb234" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "requests" ADD CONSTRAINT "FK_25154653083c4716fe2d9a99624" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "requests" ADD CONSTRAINT "FK_afdc7b37b5580c9746bd031761c" FOREIGN KEY ("offered_skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "requests" ADD CONSTRAINT "FK_4f54337fbc4db227eb8c094e544" FOREIGN KEY ("requested_skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_want_to_learn" ADD CONSTRAINT "FK_4fccf7f0785066b7024ca149c59" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_want_to_learn" ADD CONSTRAINT "FK_d9682d87dc26e31e3e6a970831c" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_favorite_skills" ADD CONSTRAINT "FK_de3d937d00b6933e38788aa50e1" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_favorite_skills" ADD CONSTRAINT "FK_b7729ebbfb24496e67528df5730" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_favorite_skills" DROP CONSTRAINT "FK_b7729ebbfb24496e67528df5730"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_favorite_skills" DROP CONSTRAINT "FK_de3d937d00b6933e38788aa50e1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_want_to_learn" DROP CONSTRAINT "FK_d9682d87dc26e31e3e6a970831c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_want_to_learn" DROP CONSTRAINT "FK_4fccf7f0785066b7024ca149c59"`,
    );
    await queryRunner.query(
      `ALTER TABLE "requests" DROP CONSTRAINT "FK_4f54337fbc4db227eb8c094e544"`,
    );
    await queryRunner.query(
      `ALTER TABLE "requests" DROP CONSTRAINT "FK_afdc7b37b5580c9746bd031761c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "requests" DROP CONSTRAINT "FK_25154653083c4716fe2d9a99624"`,
    );
    await queryRunner.query(
      `ALTER TABLE "requests" DROP CONSTRAINT "FK_7e58368e50d76813c1aca1eb234"`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" DROP CONSTRAINT "FK_88cea2dc9c31951d06437879b40"`,
    );
    await queryRunner.query(
      `ALTER TABLE "skills" DROP CONSTRAINT "FK_7f2277da303cf72a0b941a84689"`,
    );
    await queryRunner.query(
      `ALTER TABLE "skills" DROP CONSTRAINT "FK_47dd0ade7ed449a7aca9b9e6752"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b7729ebbfb24496e67528df573"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_de3d937d00b6933e38788aa50e"`,
    );
    await queryRunner.query(`DROP TABLE "user_favorite_skills"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d9682d87dc26e31e3e6a970831"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4fccf7f0785066b7024ca149c5"`,
    );
    await queryRunner.query(`DROP TABLE "user_want_to_learn"`);
    await queryRunner.query(`DROP TABLE "requests"`);
    await queryRunner.query(`DROP TYPE "public"."requests_status_enum"`);
    await queryRunner.query(`DROP TABLE "cities"`);
    await queryRunner.query(`DROP TABLE "categories"`);
    await queryRunner.query(`DROP TABLE "skills"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(`DROP TYPE "public"."users_gender_enum"`);
  }
}
