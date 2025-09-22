import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateSeriesAndMakerFK1758561686099 implements MigrationInterface {
  name = "UpdateSeriesAndMakerFK1758561686099";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "video" DROP CONSTRAINT "FK_f9fecb0be58bf0e81ef83fb267e"`
    );
    await queryRunner.query(
      `ALTER TABLE "video" DROP CONSTRAINT "FK_60fb5c7fd56db9df662c2881742"`
    );
    await queryRunner.query(`ALTER TABLE "video" DROP COLUMN "makerId"`);
    await queryRunner.query(`ALTER TABLE "video" DROP COLUMN "seriesId"`);
    await queryRunner.query(`ALTER TABLE "video" ADD "label" text`);
    await queryRunner.query(`ALTER TABLE "video" ADD "series_id" integer`);
    await queryRunner.query(`ALTER TABLE "video" ADD "maker_id" integer`);
    await queryRunner.query(
      `ALTER TABLE "video" ADD CONSTRAINT "FK_a4bb8bcf401b40c88c6e7e99011" FOREIGN KEY ("series_id") REFERENCES "series"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "video" ADD CONSTRAINT "FK_21a0451243f73cd99bbe676f285" FOREIGN KEY ("maker_id") REFERENCES "maker"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "video" DROP CONSTRAINT "FK_21a0451243f73cd99bbe676f285"`
    );
    await queryRunner.query(
      `ALTER TABLE "video" DROP CONSTRAINT "FK_a4bb8bcf401b40c88c6e7e99011"`
    );
    await queryRunner.query(`ALTER TABLE "video" DROP COLUMN "maker_id"`);
    await queryRunner.query(`ALTER TABLE "video" DROP COLUMN "series_id"`);
    await queryRunner.query(`ALTER TABLE "video" DROP COLUMN "label"`);
    await queryRunner.query(`ALTER TABLE "video" ADD "seriesId" integer`);
    await queryRunner.query(`ALTER TABLE "video" ADD "makerId" integer`);
    await queryRunner.query(
      `ALTER TABLE "video" ADD CONSTRAINT "FK_60fb5c7fd56db9df662c2881742" FOREIGN KEY ("seriesId") REFERENCES "series"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "video" ADD CONSTRAINT "FK_f9fecb0be58bf0e81ef83fb267e" FOREIGN KEY ("makerId") REFERENCES "maker"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }
}
