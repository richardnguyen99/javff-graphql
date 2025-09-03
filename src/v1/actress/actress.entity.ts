import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  OneToMany,
} from "typeorm";
import { Field, ID, ObjectType } from "@nestjs/graphql";

import { ActressImage } from "src/v1/actress/actress-image.entity";
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
  ruby?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  bust?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  cup?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  waist?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  hip?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  height?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  birthday?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  blood_type?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  hobby?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  prefectures?: string;

  @Field(() => [ActressImage], { nullable: true })
  @OneToMany(() => ActressImage, (image) => image.actress, { cascade: true })
  images?: ActressImage[];

  @Field(() => [Video], { nullable: true })
  @ManyToMany(() => Video, (video) => video.actresses)
  videos?: Video[];
}
