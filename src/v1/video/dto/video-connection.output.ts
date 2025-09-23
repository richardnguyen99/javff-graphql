import { ObjectType, Field, Int } from "@nestjs/graphql";
import { Video } from "../video.entity";

@ObjectType()
export class VideoEdge {
  @Field()
  cursor: string;

  @Field(() => Video)
  node: Video;
}

@ObjectType()
export class VideoPageInfo {
  @Field({ nullable: true })
  hasNextPage: boolean;

  @Field({ nullable: true })
  hasPreviousPage: boolean;

  @Field({ nullable: true })
  startCursor?: string;

  @Field({ nullable: true })
  endCursor?: string;
}

@ObjectType()
export class VideoConnection {
  @Field(() => [VideoEdge])
  edges: VideoEdge[];

  @Field(() => VideoPageInfo)
  pageInfo: VideoPageInfo;

  @Field(() => Int)
  totalCount: number;
}
