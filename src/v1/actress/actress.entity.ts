import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  OneToMany,
  Index,
} from "typeorm";
import { Field, ID, ObjectType } from "@nestjs/graphql";
import { Float } from "@nestjs/graphql";

import { ActressImage } from "src/v1/actress/actress-image.entity";
import { Video } from "src/v1/video/video.entity";

@ObjectType()
@Entity()
export class Actress {
  @Field(() => ID, { description: "Unique identifier for the actress" })
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => String, { description: "The actress's name" })
  @Column({ nullable: false })
  name: string;

  @Field({
    nullable: true,
    description: "DMM ID (unique identifier, optional)",
  })
  @Column({ nullable: true, name: "dmm_id" })
  @Index({ unique: true, where: "dmm_id IS NOT NULL" })
  dmmId?: string;

  @Field({ nullable: true, description: "Display name (optional)" })
  @Column({ nullable: true, name: "display_name" })
  displayName?: string;

  @Field({ nullable: true, description: "Ruby (kana reading, optional)" })
  @Column({ nullable: true, name: "ruby" })
  ruby?: string;

  @Field(() => Float, {
    nullable: true,
    description: "Bust size in cm (optional)",
  })
  @Column({ nullable: true, name: "bust", type: "float" })
  bust?: number;

  @Field({ nullable: true, description: "Cup size (optional)" })
  @Column({ nullable: true, name: "cup" })
  cup?: string;

  @Field(() => Float, {
    nullable: true,
    description: "Waist size in cm (optional)",
  })
  @Column({ nullable: true, name: "waist", type: "float" })
  waist?: number;

  @Field(() => Float, {
    nullable: true,
    description: "Hip size in cm (optional)",
  })
  @Column({ nullable: true, name: "hip", type: "float" })
  hip?: number;

  @Field(() => Float, {
    nullable: true,
    description: "Height in cm (optional)",
  })
  @Column({ nullable: true, name: "height", type: "float" })
  height?: number;

  @Field({ nullable: true, description: "Birthday (ISO 8601 date, optional)" })
  @Column({ nullable: true, name: "birthday", type: "date" })
  birthday?: Date;

  @Field({ nullable: true, description: "Blood type (optional)" })
  @Column({ nullable: true, name: "blood_type" })
  bloodType?: string;

  @Field({ nullable: true, description: "Hobby (optional)" })
  @Column({ nullable: true, name: "hobby" })
  hobby?: string;

  @Field({ nullable: true, description: "Prefectures (optional)" })
  @Column({ nullable: true, name: "prefectures" })
  prefectures?: string;

  @Field(() => [ActressImage], {
    nullable: true,
    description: "List of actress images",
  })
  @OneToMany(() => ActressImage, (image) => image.actress, { cascade: true })
  images?: ActressImage[];

  @Field(() => [Video], {
    nullable: true,
    description: "List of videos featuring the actress",
  })
  @ManyToMany(() => Video, (video) => video.actresses)
  videos?: Video[];
}
