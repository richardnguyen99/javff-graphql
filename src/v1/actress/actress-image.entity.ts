import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { Field, ID, ObjectType } from "@nestjs/graphql";

import { Actress } from "./actress.entity";

@ObjectType()
@Entity()
@Index("idx_actress_image_unique", ["actress", "attribute"], { unique: true })
export class ActressImage {
  @Field(() => ID, { description: "Unique identifier for the actress image" })
  @PrimaryGeneratedColumn()
  id: number;

  @Field({ description: "The URL of the actress image" })
  @Column()
  url: string;

  @Field({
    description:
      "The attribute or type of the image (e.g., large, small, fallback)",
  })
  @Column()
  attribute: string;

  @ManyToOne(() => Actress, (actress) => actress.images, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "actress_id" })
  actress: Actress;
}
