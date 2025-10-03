import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
  JoinColumn,
} from "typeorm";
import { ObjectType, Field, ID } from "@nestjs/graphql";

import { Video } from "./video.entity";

@ObjectType()
@Entity()
@Index(["video", "attribute"], { unique: true })
export class VideoSampleVideo {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field({
    description: "The attribute of the sample video, e.g., 'size_476_306'",
  })
  @Column()
  attribute: string;

  @Field({ description: "The URL of the sample image" })
  @Column()
  url: string;

  @Field(() => Video)
  @ManyToOne(() => Video, (video) => video.sampleImages, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "video_id" })
  video: Video;
}
