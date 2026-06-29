import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Redirecting..." }, { name: "robots", content: "noindex" }],
  }),
  loader: () => {
    throw redirect({ to: "/auth" });
  },
  component: () => null,
});
