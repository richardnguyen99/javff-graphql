import { InputType, Field, Int } from "@nestjs/graphql";

@InputType()
export class VideoQueryOptionsInput {
  @Field(() => Int, {
    nullable: true,
    description: "Number of records to fetch forward",
  })
  first?: number;

  @Field(() => String, {
    nullable: true,
    description: "Cursor for forward pagination",
  })
  after?: string;

  @Field(() => Int, {
    nullable: true,
    description: "Number of records to fetch backward",
  })
  last?: number;

  @Field(() => String, {
    nullable: true,
    description: "Cursor for backward pagination",
  })
  before?: string;
}
