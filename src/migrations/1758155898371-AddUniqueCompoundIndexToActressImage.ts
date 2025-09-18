import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUniqueCompoundIndexToActressImage1758155898371 implements MigrationInterface {
    name = 'AddUniqueCompoundIndexToActressImage1758155898371'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_actress_image_unique" ON "actress_image" ("actress_id", "attribute") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."idx_actress_image_unique"`);
    }

}
