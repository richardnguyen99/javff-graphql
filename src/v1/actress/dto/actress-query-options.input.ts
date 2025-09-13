import { InputType, Field, Int, Float } from "@nestjs/graphql";

@InputType()
export class ActressQueryOptionsInput {
  @Field({ nullable: true })
  cup?: string;

  @Field(() => Float, { nullable: true })
  bust?: number;

  @Field(() => Float, { nullable: true })
  waist?: number;

  @Field(() => Float, { nullable: true })
  hip?: number;

  @Field(() => Int, { nullable: true })
  year?: number;

  @Field({ nullable: true })
  after?: string;

  @Field({ nullable: true })
  before?: string;

  @Field(() => Int, { nullable: true })
  first?: number;

  @Field(() => Int, { nullable: true })
  last?: number;
}
