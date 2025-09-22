import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateVideoActressFKNames1758574890909 implements MigrationInterface {
    name = 'UpdateVideoActressFKNames1758574890909'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "video_actresses" ("video_id" integer NOT NULL, "actress_id" integer NOT NULL, CONSTRAINT "PK_b4f3b9b680824cd8490f8428724" PRIMARY KEY ("video_id", "actress_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_08ebe95837541d83a75908408e" ON "video_actresses" ("video_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_3396eb4a7f8e27dfd1bb8c40a2" ON "video_actresses" ("actress_id") `);
        await queryRunner.query(`ALTER TABLE "video_actresses" ADD CONSTRAINT "FK_08ebe95837541d83a75908408e9" FOREIGN KEY ("video_id") REFERENCES "video"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "video_actresses" ADD CONSTRAINT "FK_3396eb4a7f8e27dfd1bb8c40a20" FOREIGN KEY ("actress_id") REFERENCES "actress"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "video_actresses" DROP CONSTRAINT "FK_3396eb4a7f8e27dfd1bb8c40a20"`);
        await queryRunner.query(`ALTER TABLE "video_actresses" DROP CONSTRAINT "FK_08ebe95837541d83a75908408e9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3396eb4a7f8e27dfd1bb8c40a2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_08ebe95837541d83a75908408e"`);
        await queryRunner.query(`DROP TABLE "video_actresses"`);
    }

}
