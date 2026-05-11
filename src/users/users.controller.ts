import { Controller, Get, Patch, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { UsersService } from "./users.service";

@UseGuards(JwtAuthGuard)
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("me")
  me(@CurrentUser() user: { sub: string }) {
    return this.usersService.me(user.sub);
  }

  @Patch("upgrade")
  upgrade(@CurrentUser() user: { sub: string }) {
    return this.usersService.upgradeToPremium(user.sub);
  }
}
