import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
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
  imageUrl: string;

  @Field()
  @Column()
  attribute: string; // e.g., "large", "small"

  @Field(() => Actress)
  @ManyToOne(() => Actress, (actress) => actress.images, {
    onDelete: "CASCADE",
  })
  actress: Actress;
}
