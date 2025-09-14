import { InputType, Field } from "@nestjs/graphql";
import {
  IsOptional,
  IsNumber,
  Min,
  IsISO8601,
  MinLength,
} from "class-validator";
import { Transform } from "class-transformer";

import { CreateActressImageInput } from "./create-actress-image.input";
import {
  gteFormat,
  isoFormat,
  maxDecimalPlacesFormat,
  nonBlankOrEmptyStringFormat,
} from "src/common/utils/error-formatter";
import {
  safeTrimTransformer,
  strictTrimTransformer,
} from "src/common/utils/transformers";

@InputType()
export class CreateActressInput {
  @Field({ description: "The actress's name (required, non-blank)" })
  @Transform(strictTrimTransformer)
  @MinLength(1, {
    message: nonBlankOrEmptyStringFormat("name"),
  })
  name: string;

  @Field({
    nullable: true,
    description: "DMM ID (unique identifier, optional)",
  })
  @IsOptional()
  @Transform(safeTrimTransformer)
  @MinLength(1, {
    message: nonBlankOrEmptyStringFormat("dmmId"),
  })
  dmmId?: string;

  @Field({ nullable: true, description: "Display name (optional, non-blank)" })
  @IsOptional()
  @Transform(safeTrimTransformer)
  @MinLength(1, {
    message: nonBlankOrEmptyStringFormat("displayName"),
  })
  displayName?: string;

  @Field({
    nullable: true,
    description: "Ruby (kana reading, optional, non-blank)",
  })
  @IsOptional()
  @Transform(safeTrimTransformer)
  @MinLength(1, { message: nonBlankOrEmptyStringFormat("ruby") })
  ruby?: string;

  @Field({
    nullable: true,
    description: "Bust size in cm (optional, min 1, max 2 decimal places)",
  })
  @IsOptional()
  @IsNumber(
    {
      maxDecimalPlaces: 2,
    },
    {
      message: maxDecimalPlacesFormat("bust", 2),
    }
  )
  @Min(1, { message: gteFormat("bust", 1) })
  bust?: number;

  @Field({ nullable: true, description: "Cup size (optional, non-blank)" })
  @IsOptional()
  @Transform(safeTrimTransformer)
  @MinLength(1, { message: nonBlankOrEmptyStringFormat("cup") })
  cup?: string;

  @Field({
    nullable: true,
    description: "Waist size in cm (optional, min 1, max 2 decimal places)",
  })
  @IsOptional()
  @IsNumber(
    {
      maxDecimalPlaces: 2,
    },
    {
      message: maxDecimalPlacesFormat("waist", 2),
    }
  )
  @Min(1, { message: gteFormat("waist", 1) })
  waist?: number;

  @Field({
    nullable: true,
    description: "Hip size in cm (optional, min 0, max 2 decimal places)",
  })
  @IsOptional()
  @IsNumber(
    {
      maxDecimalPlaces: 2,
    },
    {
      message: maxDecimalPlacesFormat("hip", 2),
    }
  )
  @Min(0, { message: gteFormat("hip", 0) })
  hip?: number;

  @Field({
    nullable: true,
    description: "Height in cm (optional, min 0, max 2 decimal places)",
  })
  @IsOptional()
  @IsNumber(
    {
      maxDecimalPlaces: 2,
    },
    {
      message: maxDecimalPlacesFormat("height", 2),
    }
  )
  @Min(0, { message: gteFormat("height", 1) })
  height?: number;

  @Field({
    nullable: true,
    description: "Birthday (ISO 8601 format, optional)",
  })
  @IsOptional()
  @IsISO8601(
    {
      strict: true,
    },
    {
      message: isoFormat("birthday"),
    }
  )
  birthday?: string;

  @Field({ nullable: true, description: "Blood type (optional, non-blank)" })
  @IsOptional()
  @Transform(safeTrimTransformer)
  @MinLength(1, { message: nonBlankOrEmptyStringFormat("bloodType") })
  bloodType?: string;

  @Field({ nullable: true, description: "Hobby (optional, non-blank)" })
  @IsOptional()
  @Transform(safeTrimTransformer)
  @MinLength(1, { message: nonBlankOrEmptyStringFormat("hobby") })
  hobby?: string;

  @Field({ nullable: true, description: "Prefectures (optional, non-blank)" })
  @IsOptional()
  @Transform(safeTrimTransformer)
  @MinLength(1, { message: nonBlankOrEmptyStringFormat("prefectures") })
  prefectures?: string;

  @Field(() => [CreateActressImageInput], {
    nullable: true,
    description: "List of actress images (optional)",
  })
  images?: CreateActressImageInput[];
}
