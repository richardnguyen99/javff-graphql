import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Field, ID, Int, ObjectType } from "@nestjs/graphql";

import { Video } from "src/v1/video/video.entity";

@ObjectType()
@Entity()
export class Maker {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => Int)
  @Column({ name: "dmm_id", unique: true })
  dmmId: number;

  @Field(() => String)
  @Column({ unique: true, name: "name" })
  name: string;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true, name: "ruby" })
  ruby?: string;

  @Field(() => [Video], { nullable: true })
  @OneToMany(() => Video, (video) => video.maker)
  videos?: Video[];
}
