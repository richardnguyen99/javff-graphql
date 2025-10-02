import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
  JoinColumn,
} from "typeorm";
import { ObjectType, Field, ID } from "@nestjs/graphql";

import { Video } from "src/v1/video/video.entity";

@ObjectType()
@Entity()
@Index(["video", "attribute"], { unique: true })
export class VideoCover {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field({
    description: "The attribute of the cover image, e.g., 'front', 'back'",
  })
  @Column()
  attribute: string;

  @Field({
    description: "The URL of the cover image",
  })
  @Column()
  url: string;

  @ManyToOne(() => Video, (video) => video.covers, { onDelete: "CASCADE" })
  @JoinColumn({ name: "video_id" })
  video: Video;
}
