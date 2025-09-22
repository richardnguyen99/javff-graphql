import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNonNullUniqueConstraintsOnGenreDmmId1758570028155 implements MigrationInterface {
    name = 'AddNonNullUniqueConstraintsOnGenreDmmId1758570028155'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "genre" ADD "dmm_id" integer`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_b6d302ff37a992b3b8c894820f" ON "genre" ("dmm_id") WHERE dmm_id IS NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_b6d302ff37a992b3b8c894820f"`);
        await queryRunner.query(`ALTER TABLE "genre" DROP COLUMN "dmm_id"`);
    }

}
