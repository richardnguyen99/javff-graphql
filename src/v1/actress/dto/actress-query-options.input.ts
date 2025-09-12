import { InputType, Field, Int } from "@nestjs/graphql";

@InputType()
export class ActressQueryOptionsInput {
  @Field({ nullable: true })
  cup?: string;

  @Field(() => Int, { nullable: true, defaultValue: 0 })
  offset?: number;

  @Field(() => Int, { nullable: true, defaultValue: 20 })
  limit?: number;
}
