import { ObjectType, OmitType, PartialType } from "@nestjs/graphql";

import { Actress } from "../actress.entity";

@ObjectType()
export class UpdateActressOutput extends PartialType(
  OmitType(Actress, ["images", "videos"] as const)
) {}
