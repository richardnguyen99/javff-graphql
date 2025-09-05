import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Field, ID, ObjectType } from "@nestjs/graphql";

import { Actress } from "./actress.entity";

@ObjectType()
@Entity()
export class ActressImage {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column()
  url: string;

  @Field()
  @Column()
  attribute: string; // e.g., "large", "small", "fallback"

  @Field(() => Actress)
  @ManyToOne(() => Actress, (actress) => actress.images, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "actress_id" })
  actress: Actress;
}
