import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Index,
} from "typeorm";
import { Field, ID, Int, ObjectType } from "@nestjs/graphql";

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

  @Field({ nullable: true })
  @Column({ nullable: true, name: "ruby" })
  ruby?: string;

  @Field(() => Int, { nullable: true })
  @Column({ nullable: true, name: "dmm_id" })
  @Index({ unique: true, where: "dmm_id IS NOT NULL" })
  dmmId?: number;

  @OneToMany(() => Video, (video) => video.series)
  videos?: Video[];
}
