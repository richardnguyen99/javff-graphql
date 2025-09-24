import { InputType, Field, Int, ID } from "@nestjs/graphql";

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

  @Field(() => [ID], {
    nullable: true,
    description: "Filter by actress IDs (many-to-many)",
  })
  actressIds?: string[];

  @Field(() => [ID], {
    nullable: true,
    description: "Filter by genre IDs (many-to-many)",
  })
  genreIds?: string[];

  @Field(() => ID, {
    nullable: true,
    description: "Filter by maker ID (many-to-one)",
  })
  makerId?: string;

  @Field(() => ID, {
    nullable: true,
    description: "Filter by series ID (many-to-one)",
  })
  seriesId?: string;
}
