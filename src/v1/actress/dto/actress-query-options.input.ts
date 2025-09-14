import { InputType, Field, Int, Float } from "@nestjs/graphql";
import { registerEnumType } from "@nestjs/graphql";

export enum ActressSortOrder {
  ASC = "ASC",
  DESC = "DESC",
}

registerEnumType(ActressSortOrder, {
  name: "ActressSortOrder",
  description: "Sort order: ASC for ascending, DESC for descending",
});

@InputType()
export class ActressQueryOptionsInput {
  @Field({ nullable: true, description: "Filter by cup size (e.g., 'C', 'D')" })
  cup?: string;

  @Field(() => Float, {
    nullable: true,
    description: "Filter by minimum bust size (cm)",
  })
  bust?: number;

  @Field(() => Float, {
    nullable: true,
    description: "Filter by minimum waist size (cm)",
  })
  waist?: number;

  @Field(() => Float, {
    nullable: true,
    description: "Filter by minimum hip size (cm)",
  })
  hip?: number;

  @Field(() => Int, {
    nullable: true,
    description: "Filter by birth year or earlier (e.g., 1990)",
  })
  year?: number;

  @Field({ nullable: true, description: "Cursor for forward pagination" })
  after?: string;

  @Field({ nullable: true, description: "Cursor for backward pagination" })
  before?: string;

  @Field(() => Int, {
    nullable: true,
    description: "Number of records to fetch forward",
  })
  first?: number;

  @Field(() => Int, {
    nullable: true,
    description: "Number of records to fetch backward",
  })
  last?: number;

  @Field({
    nullable: true,
    description: "Sort by field ('cup', 'bust', 'waist', or 'hip' supported)",
  })
  sortBy?: "cup" | "bust" | "waist" | "hip";

  @Field(() => ActressSortOrder, {
    nullable: true,
    description: "Sort order: ASC (default) or DESC",
  })
  sortOrder?: ActressSortOrder;
}
