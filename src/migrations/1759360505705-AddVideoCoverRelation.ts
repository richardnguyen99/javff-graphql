import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVideoCoverRelation1759360505705 implements MigrationInterface {
    name = 'AddVideoCoverRelation1759360505705'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "video_cover" ("id" SERIAL NOT NULL, "attribute" character varying NOT NULL, "url" character varying NOT NULL, "video_id" integer, CONSTRAINT "PK_36a6844dc3fd859e78d1e8e7aa9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_9a9545778a571fa69cd67fbdb1" ON "video_cover" ("video_id", "attribute") `);
        await queryRunner.query(`ALTER TABLE "video_cover" ADD CONSTRAINT "FK_0dbc3a5e705e329ce0cc5e8535e" FOREIGN KEY ("video_id") REFERENCES "video"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "video_cover" DROP CONSTRAINT "FK_0dbc3a5e705e329ce0cc5e8535e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9a9545778a571fa69cd67fbdb1"`);
        await queryRunner.query(`DROP TABLE "video_cover"`);
    }

}
