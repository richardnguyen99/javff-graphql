import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVideoSampleVideoRelation1759459634529 implements MigrationInterface {
    name = 'AddVideoSampleVideoRelation1759459634529'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "video_sample_video" ("id" SERIAL NOT NULL, "attribute" character varying NOT NULL, "url" character varying NOT NULL, "video_id" integer, CONSTRAINT "PK_ef91d6ad4683b4eaa926e8336b2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_c50c4d0775d2e3c33f2a7354a7" ON "video_sample_video" ("video_id", "attribute") `);
        await queryRunner.query(`ALTER TABLE "video_sample_video" ADD CONSTRAINT "FK_d2131e51c7348cbfa80ede6c6f5" FOREIGN KEY ("video_id") REFERENCES "video"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "video_sample_video" DROP CONSTRAINT "FK_d2131e51c7348cbfa80ede6c6f5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c50c4d0775d2e3c33f2a7354a7"`);
        await queryRunner.query(`DROP TABLE "video_sample_video"`);
    }

}
