import React from "react";

type Props = {
  section: string;
  locale?: string;
  profile?: "visitor"|"investisseur"|"porteur"|"admin";
  children: React.ReactNode;
};

export function ToggleGate({ section, locale="fr-FR", profile="visitor", children }: Props) {
  // For demo purposes, always show content
  return <>{children}</>;
}