import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDmmCompatibleMakerField1758342094152 implements MigrationInterface {
    name = 'AddDmmCompatibleMakerField1758342094152'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "maker" ADD "dmm_id" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "maker" ADD CONSTRAINT "UQ_24592cc71bba5824446f4a363ee" UNIQUE ("dmm_id")`);
        await queryRunner.query(`ALTER TABLE "maker" ADD "ruby" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "maker" DROP COLUMN "ruby"`);
        await queryRunner.query(`ALTER TABLE "maker" DROP CONSTRAINT "UQ_24592cc71bba5824446f4a363ee"`);
        await queryRunner.query(`ALTER TABLE "maker" DROP COLUMN "dmm_id"`);
    }

}
