import type { operations } from "@/generated/openapi";

export type User =
  operations["AuthController_getMe"]["responses"][200]["content"]["application/json"];

export type LiffLoginRequest =
  operations["AuthController_liffLogin"]["requestBody"]["content"]["application/json"];

export type LiffLoginResponse =
  operations["AuthController_liffLogin"]["responses"][200]["content"]["application/json"];

export type LogoutResponse =
  operations["AuthController_logout"]["responses"][200]["content"]["application/json"];
