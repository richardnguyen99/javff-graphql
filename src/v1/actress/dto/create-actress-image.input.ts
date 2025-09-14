import { InputType, Field } from "@nestjs/graphql";

@InputType()
export class CreateActressImageInput {
  @Field({ description: "The URL of the actress image" })
  url: string;

  @Field({
    description: "The attribute or type of the image (e.g., profile, cover)",
  })
  attribute: string;
}
