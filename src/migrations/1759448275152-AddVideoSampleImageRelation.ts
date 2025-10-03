import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVideoSampleImageRelation1759448275152 implements MigrationInterface {
    name = 'AddVideoSampleImageRelation1759448275152'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "video_sample_image" ("id" SERIAL NOT NULL, "attribute" character varying NOT NULL, "ordering" integer NOT NULL, "url" character varying NOT NULL, "video_id" integer, CONSTRAINT "PK_b0f465b3e5d0beba4c24b3e2b7e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_c5d35b63e0ca14573eef24190a" ON "video_sample_image" ("video_id", "attribute", "ordering") `);
        await queryRunner.query(`ALTER TABLE "video_sample_image" ADD CONSTRAINT "FK_8c1f1b1553839f98e8ef841c1a8" FOREIGN KEY ("video_id") REFERENCES "video"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "video_sample_image" DROP CONSTRAINT "FK_8c1f1b1553839f98e8ef841c1a8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c5d35b63e0ca14573eef24190a"`);
        await queryRunner.query(`DROP TABLE "video_sample_image"`);
    }

}
