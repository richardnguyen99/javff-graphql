import { ObjectType, OmitType } from "@nestjs/graphql";

import { Actress } from "../actress.entity";

@ObjectType()
export class ActressOutput extends OmitType(Actress, ["videos"] as const) {}
