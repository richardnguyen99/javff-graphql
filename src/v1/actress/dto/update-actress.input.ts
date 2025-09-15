import { Field, InputType, PartialType } from "@nestjs/graphql";

import { CreateActressInput } from "./create-actress.input";
import { Transform } from "class-transformer";
import { IsOptional, MinLength } from "class-validator";
import { safeTrimTransformer } from "src/common/utils/transformers";
import { nonBlankOrEmptyStringFormat } from "src/common/utils/error-formatter";

@InputType()
export class UpdateActressInput extends PartialType(CreateActressInput) {
  @Field({
    description: "The actress's name (optional, non-blank)",
    nullable: true,
  })
  @IsOptional()
  @Transform(safeTrimTransformer)
  @MinLength(1, {
    message: nonBlankOrEmptyStringFormat("name"),
  })
  name: string;
}
