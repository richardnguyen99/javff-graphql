import { InputType, Field, Int } from "@nestjs/graphql";

@InputType()
export class ActressQueryOptionsInput {
  @Field({ nullable: true })
  cup?: string;

  @Field({ nullable: true })
  after?: string; // cursor (base64 encoded id)

  @Field(() => Int, { nullable: true, defaultValue: 20 })
  first?: number; // page size
}
