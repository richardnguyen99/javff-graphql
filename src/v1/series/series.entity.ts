import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Field, ID, ObjectType } from "@nestjs/graphql";

import { Video } from "src/v1/video/video.entity";

@ObjectType()
@Entity()
export class Series {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => String)
  @Column({ unique: true, name: "name" })
  name: string;

  @Field(() => String)
  @Column({ name: "ruby" })
  ruby: string;

  @Field({ nullable: true })
  @Column({ nullable: true, name: "dmm_id", unique: true })
  dmmId?: number;

  @OneToMany(() => Video, (video) => video.series)
  videos?: Video[];
}
