import { applyDecorators, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { RolesGuard } from "src/auth/guards/roles.guard";
import { Roles } from "./roles.decorator";
import { UserRole } from "src/user/entities/user.entity";

export const Admin = () => applyDecorators(
  UseGuards(AuthGuard('jwt'), RolesGuard),
  Roles(UserRole.ADMIN),
);