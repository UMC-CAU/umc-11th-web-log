import { createFileRoute } from "@tanstack/react-router";
import { ProfileEditPage } from "../pages/account/profile-edit-page";

export const Route = createFileRoute("/profile-edit")({ component: ProfileEditPage });
