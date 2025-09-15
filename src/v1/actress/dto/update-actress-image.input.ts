import { InputType, Field, ID } from "@nestjs/graphql";

@InputType()
export class AddActressImageInput {
  @Field(() => ID, { description: "ID of the actress" })
  actressId: number;

  @Field({ description: "The URL of the actress image" })
  url: string;

  @Field({
    description: "The attribute or type of the image (e.g., profile, cover)",
  })
  attribute: string;
}

@InputType()
export class UpdateActressImageInput {
  @Field(() => ID, { description: "ID of the actress" })
  actressId: number;

  @Field(() => ID, { description: "ID of the image" })
  id: number;

  @Field({ nullable: true, description: "The URL of the actress image" })
  url?: string;

  @Field({
    nullable: true,
    description: "The attribute or type of the image (e.g., profile, cover)",
  })
  attribute?: string;
}

@InputType()
export class RemoveActressImageInput {
  @Field(() => ID, { description: "ID of the actress" })
  actressId: number;

  @Field(() => ID, { description: "ID of the image" })
  id: number;
}
