import { ObjectType, Field, Int } from "@nestjs/graphql";
import { Actress } from "../actress.entity";

@ObjectType()
export class PageInfo {
  @Field()
  hasNextPage: boolean;

  @Field()
  hasPreviousPage: boolean;

  @Field({ nullable: true })
  startCursor?: string;

  @Field({ nullable: true })
  endCursor?: string;
}

@ObjectType()
export class ActressEdge {
  @Field()
  cursor: string;

  @Field(() => Actress)
  node: Actress;
}

@ObjectType()
export class ActressConnection {
  @Field(() => [ActressEdge])
  edges: ActressEdge[];

  @Field(() => PageInfo)
  pageInfo: PageInfo;

  @Field(() => Int)
  totalCount: number;
}
