import { ObjectType, Field } from "@nestjs/graphql";
import { Actress } from "../actress.entity";

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

  @Field()
  hasNextPage: boolean;
}
