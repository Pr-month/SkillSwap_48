import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserCityRelation1794624161771 implements MigrationInterface {
  name = 'UserCityRelation1794624161771';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "city_id" uuid`);
    // Переносим города по названию; при дублях берём самый населённый
    await queryRunner.query(`
      UPDATE "users" u SET "city_id" = (
        SELECT c."id" FROM "cities" c
        WHERE c."name" = u."city"
        ORDER BY c."population" DESC NULLS LAST, c."id"
        LIMIT 1
      )
    `);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "city"`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_03934bca2709003c5f08fd436d2" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_03934bca2709003c5f08fd436d2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "city" character varying(100)`,
    );
    await queryRunner.query(`
      UPDATE "users" u SET "city" = COALESCE(
        (SELECT c."name" FROM "cities" c WHERE c."id" = u."city_id"), ''
      )
    `);
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "city" SET NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "city_id"`);
  }
}
