import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from "typeorm";
import { Field, ID, ObjectType } from "@nestjs/graphql";

import { Video } from "src/v1/video/video.entity";

@ObjectType()
@Entity()
export class Actress {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column({ unique: true })
  name: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  birthdate?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  profileImage?: string;

  @Field(() => [Video], { nullable: true })
  @ManyToMany(() => Video, (video) => video.actresses)
  videos?: Video[];
}
