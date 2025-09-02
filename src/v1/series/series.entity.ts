import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Field, ID, ObjectType } from "@nestjs/graphql";

import { Video } from "src/v1/video/video.entity";

@ObjectType()
@Entity()
export class Series {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column({ unique: true })
  name: string;

  @Field(() => [Video], { nullable: true })
  @OneToMany(() => Video, (video) => video.series)
  videos?: Video[];
}
