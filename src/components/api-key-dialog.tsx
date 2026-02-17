"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface ApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasKey: boolean;
  onSubmit: (key: string) => void;
  onDelete: () => void;
}

export function ApiKeyDialog({
  open,
  onOpenChange,
  hasKey,
  onSubmit,
  onDelete,
}: ApiKeyDialogProps) {
  const [key, setKey] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = key.trim();

    if (!trimmed) {
      setError("API key를 입력해주세요.");
      return;
    }

    if (!trimmed.startsWith("AIzaSy")) {
      setError("올바른 Google AI API key 형식이 아닙니다. (AIzaSy...로 시작)");
      return;
    }

    onSubmit(trimmed);
    setKey("");
    setError("");
  };

  const handleDelete = () => {
    onDelete();
    setKey("");
    setError("");
  };

  return (
    <Dialog open={open} onOpenChange={hasKey ? onOpenChange : undefined}>
      <DialogContent
        className="sm:max-w-md"
        showCloseButton={hasKey}
        onInteractOutside={(e) => {
          if (!hasKey) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>API Key 설정</DialogTitle>
          <DialogDescription>
            Google AI Studio에서 무료 API key를 발급받아 입력해주세요.
            <br />
            키는 브라우저에만 저장되며 서버에 저장되지 않습니다.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm text-blue-600 underline hover:text-blue-800"
            >
              Google AI Studio에서 API key 발급받기
            </a>
            <Input
              type="password"
              value={key}
              onChange={(e) => {
                setKey(e.target.value);
                setError("");
              }}
              placeholder="AIzaSy..."
              className="font-mono"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>

          <DialogFooter className="gap-2">
            {hasKey && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
              >
                삭제
              </Button>
            )}
            <Button type="submit">{hasKey ? "키 변경" : "저장"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
