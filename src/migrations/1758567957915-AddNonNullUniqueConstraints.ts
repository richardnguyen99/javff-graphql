import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNonNullUniqueConstraints1758567957915 implements MigrationInterface {
    name = 'AddNonNullUniqueConstraints1758567957915'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "series" DROP CONSTRAINT "UQ_f5e8d43594cd1592b7682fffb11"`);
        await queryRunner.query(`ALTER TABLE "maker" ALTER COLUMN "dmm_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "maker" DROP CONSTRAINT "UQ_24592cc71bba5824446f4a363ee"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_25408fbdc7a3444436e7674f0d" ON "series" ("dmm_id") WHERE dmm_id IS NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_19f39ef1c475c02e5caf0d8db6" ON "maker" ("dmm_id") WHERE dmm_id IS NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_19f39ef1c475c02e5caf0d8db6"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_25408fbdc7a3444436e7674f0d"`);
        await queryRunner.query(`ALTER TABLE "maker" ADD CONSTRAINT "UQ_24592cc71bba5824446f4a363ee" UNIQUE ("dmm_id")`);
        await queryRunner.query(`ALTER TABLE "maker" ALTER COLUMN "dmm_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "series" ADD CONSTRAINT "UQ_f5e8d43594cd1592b7682fffb11" UNIQUE ("dmm_id")`);
    }

}
