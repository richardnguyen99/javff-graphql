import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from "typeorm";
import { Field, ID, ObjectType } from "@nestjs/graphql";
import { Video } from "src/v1/video/video.entity";

@ObjectType()
@Entity()
export class Genre {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field({ description: "The name of the genre" })
  @Column({ nullable: false })
  name: string;

  @Field({ nullable: true, description: "Ruby reading of the genre name" })
  @Column({ nullable: true })
  ruby?: string;

  @Field({ nullable: true, description: "English display name of the genre" })
  @Column({ nullable: true, name: "display_name" })
  displayName?: string;

  @Field(() => [Video], { nullable: true })
  @ManyToMany(() => Video, (video) => video.genres)
  videos?: Video[];
}
