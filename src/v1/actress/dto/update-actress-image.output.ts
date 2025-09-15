import { ObjectType, Field, Int } from "@nestjs/graphql";

@ObjectType()
export class ActressImageOutput {
  @Field(() => Int)
  id: number;

  @Field()
  url: string;

  @Field()
  attribute: string;
}
