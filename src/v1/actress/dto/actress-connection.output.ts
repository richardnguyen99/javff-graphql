import { ObjectType, Field, Int } from "@nestjs/graphql";
import { Actress } from "../actress.entity";

@ObjectType()
export class PageInfo {
  @Field({ description: "Indicates if there are more pages after this one" })
  hasNextPage: boolean;

  @Field({ description: "Indicates if there are pages before this one" })
  hasPreviousPage: boolean;

  @Field({
    nullable: true,
    description: "Cursor of the first item in the current page",
  })
  startCursor?: string;

  @Field({
    nullable: true,
    description: "Cursor of the last item in the current page",
  })
  endCursor?: string;
}

@ObjectType()
export class ActressEdge {
  @Field({ description: "A cursor for use in pagination" })
  cursor: string;

  @Field(() => Actress, { description: "The actress node" })
  node: Actress;
}

@ObjectType()
export class ActressConnection {
  @Field(() => [ActressEdge], {
    description: "A list of edges (actress nodes with cursors)",
  })
  edges: ActressEdge[];

  @Field(() => PageInfo, {
    description: "Pagination information for this connection",
  })
  pageInfo: PageInfo;

  @Field(() => Int, {
    description: "Total number of actresses matching the filter",
  })
  totalCount: number;
}
