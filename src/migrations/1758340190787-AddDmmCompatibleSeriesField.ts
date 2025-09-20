import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDmmCompatibleSeriesField1758340190787
  implements MigrationInterface
{
  name = "AddDmmCompatibleSeriesField1758340190787";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "series" ADD "ruby" character varying NOT NULL`
    );
    await queryRunner.query(`ALTER TABLE "series" ADD "dmm_id" integer`);
    await queryRunner.query(
      `ALTER TABLE "series" ADD CONSTRAINT "UQ_f5e8d43594cd1592b7682fffb11" UNIQUE ("dmm_id")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "series" DROP CONSTRAINT "UQ_f5e8d43594cd1592b7682fffb11"`
    );
    await queryRunner.query(`ALTER TABLE "series" DROP COLUMN "dmm_id"`);
    await queryRunner.query(`ALTER TABLE "series" DROP COLUMN "ruby"`);
  }
}
