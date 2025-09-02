import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  ManyToOne,
  JoinTable,
} from "typeorm";
import { Field, ID, ObjectType } from "@nestjs/graphql";

import { Actress } from "src/v1/actress/actress.entity";
import { Series } from "src/v1/series/series.entity";
import { Maker } from "src/v1/maker/maker.entity";

@ObjectType()
@Entity()
export class Video {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column({ unique: true })
  code: string;

  @Field()
  @Column()
  title: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  coverImage?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  releaseDate?: string;

  @Field(() => [Actress], { nullable: true })
  @ManyToMany(() => Actress, (actress) => actress.videos, { cascade: true })
  @JoinTable()
  actresses?: Actress[];

  @Field(() => Series, { nullable: true })
  @ManyToOne(() => Series, (series) => series.videos, { nullable: true })
  series?: Series;

  @Field(() => Maker, { nullable: true })
  @ManyToOne(() => Maker, (maker) => maker.videos, { nullable: true })
  maker?: Maker;
}
