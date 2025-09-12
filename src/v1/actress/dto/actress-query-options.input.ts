import { InputType, Field, Int } from "@nestjs/graphql";

@InputType()
export class ActressQueryOptionsInput {
  @Field({ nullable: true })
  cup?: string;

  @Field({ nullable: true })
  after?: string;

  @Field({ nullable: true })
  before?: string;

  @Field(() => Int, { nullable: true })
  first?: number;

  @Field(() => Int, { nullable: true })
  last?: number;
}
