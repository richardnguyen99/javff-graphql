import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  ManyToOne,
  JoinTable,
  Index,
  JoinColumn,
} from "typeorm";
import { Field, ID, ObjectType } from "@nestjs/graphql";

import { Actress } from "src/v1/actress/actress.entity";
import { Series } from "src/v1/series/series.entity";
import { Maker } from "src/v1/maker/maker.entity";
import { Genre } from "src/v1/video/genre.entity";

@ObjectType()
@Entity()
export class Video {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field({ nullable: true, description: "The unique code of the video" })
  @Column({ nullable: true, name: "code" })
  @Index({ unique: true, where: "code IS NOT NULL" })
  code: string;

  @Field({
    nullable: true,
    description: "DMM ID (unique identifier, optional)",
  })
  @Column({ nullable: true, name: "dmm_id" })
  @Index({ unique: true, where: "dmm_id IS NOT NULL" })
  dmmId?: string;

  @Field({
    nullable: false,
    description: "The title of the video",
  })
  @Column({ nullable: false, name: "title" })
  title: string;

  @Field({ nullable: true, description: "The description of the video" })
  @Column({ nullable: true, type: "text", name: "description" })
  description?: string;

  @Field({ nullable: true, description: "The label that the video belongs to" })
  @Column({ nullable: true, type: "text", name: "label" })
  label?: string;

  @Field({
    nullable: true,
    description: "The release date of the video in ISO 8601",
  })
  @Column({ nullable: true, name: "release_date", type: "date" })
  releaseDate?: Date;

  @Field({ nullable: true, description: "The length of the video in minutes" })
  @Column({ nullable: true, name: "length", type: "int" })
  length?: number;

  @Field(() => [Actress], { nullable: true })
  @ManyToMany(() => Actress, (actress) => actress.videos, { cascade: true })
  @JoinTable({
    name: "video_actresses", // Junction table name
    joinColumn: { name: "video_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "actress_id", referencedColumnName: "id" },
  })
  actresses?: Actress[];

  @Field(() => [Genre], { nullable: true })
  @ManyToMany(() => Genre, (genre) => genre.videos, { cascade: true })
  @JoinTable({
    name: "video_genres",
    joinColumn: { name: "video_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "genre_id", referencedColumnName: "id" },
  })
  genres?: Genre[];

  @Field(() => Series, { nullable: true })
  @ManyToOne(() => Series, (series) => series.videos, { nullable: true })
  @JoinColumn({ name: "series_id" })
  series?: Series;

  @Field(() => Maker, { nullable: true })
  @ManyToOne(() => Maker, (maker) => maker.videos, { nullable: true })
  @JoinColumn({ name: "maker_id" })
  maker?: Maker;
}
