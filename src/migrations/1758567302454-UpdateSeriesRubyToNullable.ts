import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateSeriesRubyToNullable1758567302454 implements MigrationInterface {
    name = 'UpdateSeriesRubyToNullable1758567302454'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "series" ALTER COLUMN "ruby" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "series" ALTER COLUMN "ruby" SET NOT NULL`);
    }

}
