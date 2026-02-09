"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ErrorMessageProps {
  message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <Alert variant="destructive">
      <AlertTitle>오류</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
