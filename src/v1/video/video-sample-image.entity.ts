import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
  JoinColumn,
} from "typeorm";
import { ObjectType, Field, ID, Int } from "@nestjs/graphql";
import { Video } from "./video.entity";

@ObjectType()
@Entity()
@Index(["video", "attribute", "ordering"], { unique: true })
export class VideoSampleImage {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field({ description: "The attribute of the sample image, e.g., 'sample_s'" })
  @Column()
  attribute: string;

  @Field(() => Int, { description: "Ordering of the sample image" })
  @Column({ type: "int" })
  ordering: number;

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
