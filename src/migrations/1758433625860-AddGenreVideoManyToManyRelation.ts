import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGenreVideoManyToManyRelation1758433625860
  implements MigrationInterface
{
  name = "AddGenreVideoManyToManyRelation1758433625860";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "genre" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "ruby" character varying, "display_name" character varying, CONSTRAINT "PK_0285d4f1655d080cfcf7d1ab141" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "video_genres" ("video_id" integer NOT NULL, "genre_id" integer NOT NULL, CONSTRAINT "PK_5f078866d542ad034aeae086841" PRIMARY KEY ("video_id", "genre_id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8653ec24ab6e06090c8802cd59" ON "video_genres" ("video_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6ac2627bc56786632542b01bd3" ON "video_genres" ("genre_id") `
    );
    await queryRunner.query(`ALTER TABLE "video" DROP COLUMN "coverImage"`);
    await queryRunner.query(`ALTER TABLE "video" DROP COLUMN "releaseDate"`);
    await queryRunner.query(
      `ALTER TABLE "video" ADD "dmm_id" character varying`
    );
    await queryRunner.query(`ALTER TABLE "video" ADD "description" text`);
    await queryRunner.query(`ALTER TABLE "video" ADD "release_date" date`);
    await queryRunner.query(`ALTER TABLE "video" ADD "length" integer`);
    await queryRunner.query(
      `ALTER TABLE "video" ALTER COLUMN "code" DROP NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "video" DROP CONSTRAINT "UQ_aa44b0f8bde6d6a96821c458d1b"`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_c67fe777ee54cc4436b970a2dd" ON "video" ("code") WHERE code IS NOT NULL`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_223463d6b3a59ba715681f21a9" ON "video" ("dmm_id") WHERE dmm_id IS NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "video_genres" ADD CONSTRAINT "FK_8653ec24ab6e06090c8802cd595" FOREIGN KEY ("video_id") REFERENCES "video"("id") ON DELETE CASCADE ON UPDATE CASCADE`
    );
    await queryRunner.query(
      `ALTER TABLE "video_genres" ADD CONSTRAINT "FK_6ac2627bc56786632542b01bd33" FOREIGN KEY ("genre_id") REFERENCES "genre"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "video_genres" DROP CONSTRAINT "FK_6ac2627bc56786632542b01bd33"`
    );
    await queryRunner.query(
      `ALTER TABLE "video_genres" DROP CONSTRAINT "FK_8653ec24ab6e06090c8802cd595"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_223463d6b3a59ba715681f21a9"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c67fe777ee54cc4436b970a2dd"`
    );
    await queryRunner.query(
      `ALTER TABLE "video" ADD CONSTRAINT "UQ_aa44b0f8bde6d6a96821c458d1b" UNIQUE ("code")`
    );
    await queryRunner.query(
      `ALTER TABLE "video" ALTER COLUMN "code" SET NOT NULL`
    );
    await queryRunner.query(`ALTER TABLE "video" DROP COLUMN "length"`);
    await queryRunner.query(`ALTER TABLE "video" DROP COLUMN "release_date"`);
    await queryRunner.query(`ALTER TABLE "video" DROP COLUMN "description"`);
    await queryRunner.query(`ALTER TABLE "video" DROP COLUMN "dmm_id"`);
    await queryRunner.query(`ALTER TABLE "maker" DROP COLUMN "ruby"`);
    await queryRunner.query(
      `ALTER TABLE "maker" DROP CONSTRAINT "UQ_24592cc71bba5824446f4a363ee"`
    );
    await queryRunner.query(`ALTER TABLE "maker" DROP COLUMN "dmm_id"`);
    await queryRunner.query(
      `ALTER TABLE "video" ADD "releaseDate" character varying`
    );
    await queryRunner.query(
      `ALTER TABLE "video" ADD "coverImage" character varying`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6ac2627bc56786632542b01bd3"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8653ec24ab6e06090c8802cd59"`
    );
    await queryRunner.query(`DROP TABLE "video_genres"`);
    await queryRunner.query(`DROP TABLE "genre"`);
  }
}
