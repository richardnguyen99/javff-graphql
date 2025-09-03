import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from "typeorm";
import { Field, ID, ObjectType } from "@nestjs/graphql";

import { Video } from "src/v1/video/video.entity";

@ObjectType()
export class ImageURL {
  @Field({ nullable: true })
  small?: string;

  @Field({ nullable: true })
  large?: string;
}

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

  @Field(() => ImageURL, { nullable: true })
  @Column({ type: "json", nullable: true })
  imageURL?: ImageURL;

  @Field(() => [Video], { nullable: true })
  @ManyToMany(() => Video, (video) => video.actresses)
  videos?: Video[];
}
